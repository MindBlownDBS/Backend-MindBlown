const mongoose = require('mongoose');

const mindTrackerSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    mood: { type: String, required: true },
    progress: { type: String, required: true}
}, { 
    timestamps: true,
    collection: 'mindTracker'
});

module.exports = mongoose.model('MindTracker', mindTrackerSchema);