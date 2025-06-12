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
        
        const inputDate = new Date(date);
        
        const startDate = new Date(inputDate);
        startDate.setUTCDate(startDate.getUTCDate() - 1);
        startDate.setUTCHours(17, 0, 0, 0);
        
        const endDate = new Date(inputDate);
        endDate.setUTCHours(16, 59, 59, 999);
        
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

const getMonthlyTrackerHandler = async (request, h) => {
    try {
        const { id: userId } = request.auth.credentials;
        const { startDate } = request.query;
        
        let monthStart;
        if (startDate) {
            if (startDate.length === 7) {
                const [year, month] = startDate.split('-');
                monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
            } else {
                const inputDate = new Date(startDate);
                monthStart = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
            }
        } else {
            const now = new Date();
            monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const entries = await mindTracker.find({
            userId,
            date: {
                $gte: monthStart,
                $lte: monthEnd
            }
        }).sort({ date: 1 });
        
        const daysInMonth = monthEnd.getDate();
        
        const monthlyDetails = [];
        
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), i);
            
            const dayEntry = entries.find(entry => {
                const entryDate = new Date(entry.date);
                const entryDateString = entryDate.toISOString().split('T')[0];
                const currentDateString = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
                
                return entryDateString === currentDateString;
            });
                        
            if (dayEntry) {
                monthlyDetails.push({
                    date: `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`,
                    dayNumber: i,
                    hasEntry: true,
                    mood: dayEntry.mood,
                    progress: dayEntry.progress,
                    createdAt: dayEntry.createdAt
                });
            } else {
                monthlyDetails.push({
                    date: `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`,
                    dayNumber: i,
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
                monthRange: {
                    start: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-${String(monthStart.getDate()).padStart(2, '0')}`,
                    end: `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`,
                    month: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    totalDays: daysInMonth
                },
                monthlyDetails: monthlyDetails
            }
        }).code(200);
        
    } catch (error) {
        console.error('Error getting monthly mood data:', error);
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
    getMonthlyTrackerHandler,
    triggerMindTrackerRemindersHandler
};