const Notification = require('../models/notification');

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
    getNotificationsHandler,
    markNotificationReadHandler,
    markAllNotificationsReadHandler
};