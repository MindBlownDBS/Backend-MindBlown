const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromUsername: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['comment', 'reply', 'like', 'reminder'],
        required: true
    },
    message: {
        type: String,
        default: null
    },
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        default: null
    },
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;