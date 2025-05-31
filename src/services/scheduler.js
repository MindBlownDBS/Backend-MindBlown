const schedule = require('node-schedule');
const users = require('../models/user');
const mindTracker = require('../models/mind-tracker');
const Notification = require('../models/notification');

const hasSubmittedMindTracker = async (userId) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const entry = await mindTracker.findOne({
        userId,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    });
    
    return !!entry;
};

const sendMindTrackerReminders = async () => {
    try {
        console.log("Running mind tracker reminder check...");
        
        const allUsers = await users.find({});
        const today = new Date();
        
        for (const user of allUsers) {
            const hasSubmitted = await hasSubmittedMindTracker(user._id);
            
            if (!hasSubmitted) {
                const notification = new Notification({
                    userId: user._id,
                    fromUserId: user._id,
                    fromUsername: "MindBlown",
                    type: 'reminder',
                    message: "Hai, Kamu belum mengisi Daily Mind Tracker-mu"
                });
                
                await notification.save();
                console.log(`Reminder notification sent to user: ${user.username}`);
            }
        }
        
        console.log("Mind tracker reminder check completed");
    } catch (error) {
        console.error("Error sending mind tracker reminders:", error);
    }
};

const initScheduler = () => {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 10;
    rule.minute = 0;
    
    const job = schedule.scheduleJob(rule, sendMindTrackerReminders);
    
    console.log("Mind tracker reminder scheduler initialized");
    
    return job;
};

module.exports = { 
    initScheduler,
    sendMindTrackerReminders
};