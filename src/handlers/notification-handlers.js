const Notification = require('../models/notification');
const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:zidanealfatih14@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        const User = require('../models/user');
        const user = await User.findById(userId);
                
        if (!user || !user.pushSubscription) {
            console.log('No push subscription found for user:', userId);
            return;
        }

        const subscription = user.pushSubscription;
        if (!subscription.endpoint || !subscription.keys) {
            console.log('Invalid subscription format for user:', userId);
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            // icon: '/icon-192x192.png',
            // badge: '/badge-72x72.png'
        });

        const response = await webpush.sendNotification(
            subscription,
            payload
        );
        
        return response;
    } catch (error) {
        console.error('Error sending push notification:', error);
        
        if (error.statusCode === 410 || error.statusCode === 404) {
            const User = require('../models/user');
            await User.findByIdAndUpdate(userId, { 
                $unset: { pushSubscription: 1 } 
            });
        }
    }
};

const subscribePushHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        const { subscription } = request.payload;
        
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return h.response({
                error: true,
                message: 'Format subscription tidak valid'
            }).code(400);
        }
        
        let endpoint = subscription.endpoint;

        const validatedSubscription = {
            endpoint: endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        };
        
        const User = require('../models/user');
        await User.findByIdAndUpdate(userId, { 
            pushSubscription: validatedSubscription 
        });
                
        return h.response({
            error: false,
            message: 'Push subscription berhasil disimpan'
        }).code(200);
    } catch (error) {
        console.error('Error subscribePushHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const unsubscribePushHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        
        const User = require('../models/user');
        await User.findByIdAndUpdate(userId, { 
            $unset: { pushSubscription: 1 } 
        });
        
        return h.response({
            error: false,
            message: 'Push subscription berhasil dihapus'
        }).code(200);
    } catch (error) {
        console.error('Error unsubscribePushHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const getNotificationsHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .lean();
        
        return h.response({
            error: false,
            data: notifications
        }).code(200);
    } catch (error) {
        console.error('Error getNotificationsHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const markNotificationReadHandler = async (request, h) => {
    try {
        const { notificationId } = request.params;
        const userId = request.auth.credentials.id;
        
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return h.response({
                error: true,
                message: 'Notifikasi tidak ditemukan'
            }).code(404);
        }
        
        if (notification.userId.toString() !== userId) {
            return h.response({
                error: true,
                message: 'Anda tidak memiliki izin untuk mengakses notifikasi ini'
            }).code(403);
        }
        
        notification.read = true;
        await notification.save();
        
        return h.response({
            error: false,
            message: 'Notifikasi ditandai telah dibaca'
        }).code(200);
    } catch (error) {
        console.error('Error markNotificationReadHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const markAllNotificationsReadHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        
        await Notification.updateMany(
            { userId, read: false },
            { read: true }
        );
        
        return h.response({
            error: false,
            message: 'Semua notifikasi ditandai telah dibaca'
        }).code(200);
    } catch (error) {
        console.error('Error markAllNotificationsReadHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

module.exports = {
    sendPushNotification,
    subscribePushHandler,
    unsubscribePushHandler,
    getNotificationsHandler,
    markNotificationReadHandler,
    markAllNotificationsReadHandler
};