const mindTracker = require('../models/mind-tracker');
const { sendMindTrackerReminders } = require('../services/scheduler');

const mindTrackerHandler = async (request, h) => {
    try {
        const { progress } = request.payload;        
        const userId = request.auth.credentials.id;
        const username = request.auth.credentials.username;

        if (!progress) {
            return h.response({ 
                error: true,
                message: 'Fields progres harus diisi'
            }).code(400);
        }

        const newProgress = await mindTracker.create({
            userId: userId,
            username: username,
            progress,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        return h.response({
            error: false,
            message: 'Progress berhasil disimpan',
            data: newProgress
        }).code(201);

    } catch (error) {
        console.error('Error mindTrackerHandler:', error);
        return h.response({ 
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const checkMindTrackerHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        const { date } = request.params;
        
        const startDate = new Date(`${date}T00:00:00.000Z`);
        const endDate = new Date(`${date}T23:59:59.999Z`);
        
        const entry = await mindTracker.findOne({
            date: {
                $gte: startDate,
                $lte: endDate
            },
            userId: userId
        });
        
        return { exists: !!entry };
    } catch (error) {
        console.error('Error checking mind tracker entry:', error);
        return h.response({ 
            error: true, 
            message: 'Error checking mind tracker entry'
        }).code(500);
    }
};

const getMindTrackerHandler = async (request, h) => {
    try {
        const { date } = request.params;
        const { id: userId } = request.auth.credentials;
        
        // Create start and end date for the given date (to match entire day)
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Find entry in database for this user and date range
        const entry = await mindTracker.findOne({
            userId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });
        
        if (entry) {
            return h.response({
                status: 'success',
                data: {
                    mood: entry.mood,
                    progress: entry.progress
                }
            }).code(200);
        }
        
        return h.response({
            status: 'success',
            message: 'No entry found for this date',
            data: null
        }).code(200);
        
    } catch (error) {
        console.error(error);
        return h.response({
            status: 'error',
            message: 'Server error'
        }).code(500);
    }
};

const triggerMindTrackerRemindersHandler = async (request, h) => {
    try {
        // Only allow administrators to trigger this
        const user = request.auth.credentials;
        
        // Optional: admin check (in case the trigger is bugged and need to be manually triggered)
        // if (!user.isAdmin) {
        //     return h.response({
        //         error: true,
        //         message: 'Unauthorized'
        //     }).code(403);
        // }
        
        await sendMindTrackerReminders();
        
        return h.response({
            error: false,
            message: 'Mind tracker reminders triggered successfully'
        }).code(200);
    } catch (error) {
        console.error('Error triggerMindTrackerRemindersHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

module.exports = {
    mindTrackerHandler,
    checkMindTrackerHandler,
    getMindTrackerHandler,
    triggerMindTrackerRemindersHandler
};