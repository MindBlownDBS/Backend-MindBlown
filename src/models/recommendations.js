const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    initialActivity: {
        activityId: String,
        category: String,
        duration: String,
        energy_needed: String,
        features: String,
        name: String
    },
    recommendations: [{
        category: String,
        duration: String,
        energy_needed: String,
        name: String,
        similarity_score: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);