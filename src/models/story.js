const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    username: {
        type: String
    },
    name: {
        type: String,
    },
    content: {
        type: String,
        required: true
    },
    parentCommentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        default: null 
    },
    replies: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    }],
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    viewCount: { 
        type: Number 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const storySchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    username: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    isAnonymous: { type: Boolean, default: false },
    likes: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    comments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    }],
    viewCount: { 
        type: Number 
    },
    createdAt: { 
        type: Date, default: Date.now 
    },
}, { 
    timestamps: true,
    collection: 'story'
});

module.exports = {
    Story: mongoose.model('Story', storySchema),
    Comment: mongoose.model('Comment', commentSchema)
};