const users = require('../models/user');
const { Story, Comment } = require('../models/story');

const getUserProfileHandler = async (request, h) => {
    try {
        const { username } = request.params;
        const requesterId = request.auth.credentials.id;
        
        const user = await users.findOne({ username }).lean();
        
        if (!user) {
            return h.response({
                error: true,
                message: 'User tidak ditemukan'
            }).code(404);
        }
        
        const userStories = await Story.find({ 
            userId: user._id,
            isAnonymous: false
        }).lean().sort({ createdAt: -1 });
        
        const isOwner = user._id.toString() === requesterId;

        const formattedStories = userStories.map(story => {
            const isLiked = requesterId && story.likes ? 
                story.likes.some(like => like.userId && like.userId.toString() === requesterId) : 
                false
            ;
                
            return {
                ...story,
                likeCount: story.likes ? story.likes.length : 0,
                commentCount: story.comments ? story.comments.length : 0,
                userLiked: isLiked,
            };
        });
        
        const responseData = {
            username: user.username,
            name: user.name,
            profilePicture: user.profilePicture,
            stories: formattedStories
        };
        
        if (isOwner) {
            responseData.email = user.email;
        }
        
        return h.response({
            error: false,
            data: responseData
        }).code(200);
    } catch (error) {
        console.error('Error getUserProfileHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const editProfileHandler = async (request, h) => {
    try {
        const userId = request.auth.credentials.id;
        const { username, name, profilePicture } = request.payload;
        
        const user = await users.findById(userId);
        
        if (!user) {
            return h.response({
                error: true,
                message: 'User tidak ditemukan'
            }).code(404);
        }
        
        const updates = {};
        
        if (username && username !== user.username) {
            const existingUser = await users.findOne({ username });
            if (existingUser) {
                return h.response({
                    error: true,
                    message: 'Username sudah digunakan'
                }).code(400);
            }
            updates.username = username;
        }
        
        if (name) {
            updates.name = name;
        }
        
        if (profilePicture !== undefined) {
            updates.profilePicture = profilePicture;
        }
        
        if (Object.keys(updates).length === 0) {
            return h.response({
                error: false,
                message: 'Tidak ada perubahan data',
                data: {
                    username: user.username,
                    name: user.name,
                    profilePicture: user.profilePicture,
                    email: user.email
                }
            }).code(200);
        }
        
        const updatedUser = await users.findByIdAndUpdate(
            userId, 
            updates,
            { new: true }
        );
        
        if (updates.username) {
            await Story.updateMany(
                { userId: userId, isAnonymous: false },
                { username: updates.username }
            );
            
            await Comment.updateMany(
                { userId: userId },
                { username: updates.username }
            );
        }
        
        if (updates.name) {
            await Story.updateMany(
                { userId: userId, isAnonymous: false },
                { name: updates.name }
            );
            
            await Comment.updateMany(
                { userId: userId },
                { name: updates.name }
            );
        }
        
        return h.response({
            error: false,
            message: 'Profil berhasil diperbarui',
            data: {
                username: updatedUser.username,
                name: updatedUser.name,
                profilePicture: updatedUser.profilePicture,
                email: updatedUser.email
            }
        }).code(200);
        
    } catch (error) {
        console.error('Error editProfileHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

module.exports = {
    getUserProfileHandler,
    editProfileHandler
};