const mongoose = require('mongoose');

const mindTrackerSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User' 
    },
    username: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    mood: { 
        type: String, 
        required: false 
    },
    progress: { 
        type: String, 
        required: true 
    }
}, {
    collection: 'mindTracker'
});

module.exports = mongoose.model('MindTracker', mindTrackerSchema);