const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    profilePicture: { 
        type: String, 
        default: null 
    },
    stories: [{
        caption: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date }
    }]
}, { 
    timestamps: true,
    collection: 'user'
});

module.exports = mongoose.model('User', userSchema);
