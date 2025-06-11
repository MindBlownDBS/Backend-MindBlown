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

        let predictedMood = null;
        
        try {
            const response = await fetch('https://illyaveil-emotion-detection.hf.space/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: progress
                })
            });

            if (response.ok) {
                const moodData = await response.json();
                predictedMood = moodData.prediction;
            } else {
                console.warn('Mood prediction API failed, continuing without mood');
            }
        } catch (apiError) {
            console.error('Error calling mood prediction API:', apiError);
        }

        const now = new Date();
        const indonesianTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        
        const newProgress = await mindTracker.create({
            userId: userId,
            username: username,
            progress,
            mood: predictedMood,
            date: indonesianTime,
            createdAt: now
        });

        return h.response({
            error: false,
            message: 'Progress berhasil disimpan',
            data: {
                ...newProgress.toObject(),
                moodPrediction: predictedMood ? {
                    mood: predictedMood,
                } : null
            }
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
        
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
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

const getWeeklyTrackerHandler = async (request, h) => {
    try {
        const { id: userId } = request.auth.credentials;
        const { startDate } = request.query;
        
        let weekStart;
        if (startDate) {
            weekStart = new Date(startDate);
        } else {
            weekStart = new Date();
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
        }
        
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const entries = await mindTracker.find({
            userId,
            date: {
                $gte: weekStart,
                $lte: weekEnd
            }
        }).sort({ date: 1 });
        
        const weeklyDetails = [];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            
            const dayEntry = entries.find(entry => {
                const entryDate = new Date(entry.date);
                const entryDateString = entryDate.toISOString().split('T')[0];
                const currentDateString = currentDay.toISOString().split('T')[0];
                
                return entryDateString === currentDateString;
            });
            
            if (dayEntry) {
                weeklyDetails.push({
                    date: currentDay.toISOString().split('T')[0],
                    dayName: dayNames[i],
                    hasEntry: true,
                    mood: dayEntry.mood,
                    progress: dayEntry.progress,
                    createdAt: dayEntry.createdAt
                });
            } else {
                weeklyDetails.push({
                    date: currentDay.toISOString().split('T')[0],
                    dayName: dayNames[i],
                    hasEntry: false,
                    mood: null,
                    progress: null,
                    createdAt: null
                });
            }
        }
        
        return h.response({
            status: 'success',
            data: {
                weekRange: {
                    start: weekStart.toISOString().split('T')[0],
                    end: weekEnd.toISOString().split('T')[0]
                },
                weeklyDetails: weeklyDetails
            }
        }).code(200);
        
    } catch (error) {
        console.error('Error getting weekly mood data:', error);
        return h.response({
            status: 'error',
            message: 'Server error'
        }).code(500);
    }
};

const triggerMindTrackerRemindersHandler = async (request, h) => {
    try {
        const user = request.auth.credentials;
        
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
    getWeeklyTrackerHandler,
    triggerMindTrackerRemindersHandler
};