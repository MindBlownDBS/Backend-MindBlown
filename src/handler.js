const Bcrypt = require('bcrypt');
const JWT = require('@hapi/jwt');
const users = require('./models/user');
const mindTracker = require('./models/mindTracker');
const { Story, Comment } = require('./models/story');
const { key, algorithm } = require('./config/jwt');

const registerHandler = async (request, h) => {
    try {
        const { username, name, email, password } = request.payload;

        if (!username || !name || !email || !password) {
            return h.response({ 
                error: true,
                message: 'Semua field harus diisi'
            }).code(400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return h.response({ 
                error: true,
                message: 'Format email tidak valid'
            }).code(400);
        }

        const existingUser = await users.findOne({
            $or: [
                { username },
                { email }
            ]
        });


        if (existingUser) {
            if (existingUser.username === username) {
                return h.response({ 
                    error: true,
                    message: 'Username sudah terdaftar'
                }).code(400);
            }
            if (existingUser.email === email) {
                return h.response({ 
                    error: true,
                    message: 'Email sudah terdaftar'
                }).code(400);
            }
        }

        const passwordHash = await Bcrypt.hash(password, 10);

        const newUser = new users({
            username,
            name,
            email,
            passwordHash
        });

        await newUser.save();

        return h.response({
            error: false,
            message: 'Registrasi berhasil',
            data: {
                username: newUser.username,
                name: newUser.name,
                email: newUser.email
            }
        }).code(201);
    } catch (error) {
        console.error('Error registerHandler:', error);
        return h.response({ 
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const loginHandler = async (request, h) => {
    try {
        const { usernameOrEmail, password } = request.payload;

        if (!usernameOrEmail || !password) {
            return h.response({ 
                error: true,
                message: 'Username/Email dan password harus diisi'
            }).code(400);
        }

        const user = await users.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        });

        if (!user) {
            return h.response({ 
                error: true,
                message: 'Username/Email tidak ditemukan'
            }).code(404);
        }

        const validPassword = await Bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return h.response({ 
                error: true,
                message: 'Password salah'
            }).code(401);
        }

        const token = JWT.token.generate(
            {
                aud: 'urn:audience:mindblown',
                iss: 'urn:issuer:mindblown',
                sub: user._id.toString(),
                
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                name: user.name
            },
            {
                key: key,
                algorithm: algorithm
            },
            {
                ttlSec: 86400
            }
        );

        return h.response({
            error: false,
            message: 'Login berhasil',
            data: {
                name: user.name,
                username: user.username,
                email: user.email,
                token
            }
        }).code(200);
    } catch (error) {
        console.error('Error loginHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

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
        
        const formattedStories = userStories.map(story => ({
            ...story,
            likeCount: story.likes ? story.likes.length : 0,
            commentCount: story.comments ? story.comments.length : 0
        }));
        
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

const mindTrackerHandler = async (request, h) => {
    try {
        const { progress, mood } = request.payload;        
        const userId = request.auth.credentials.id;
        const username = request.auth.credentials.username;

        if (!progress || !mood) {
            return h.response({ 
                error: true,
                message: 'Fields progres dan mood harus diisi'
            }).code(400);
        }

        const newProgress = await mindTracker.create({
            userId: userId,
            username: username,
            progress,
            mood,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        return h.response({
            error: false,
            message: 'Progress berhasil disimpan',
            data: newProgress
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
        
        // Create start and end date for the given date (to match entire day)
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Find entry in database for this user and date range
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

const createStoryHandler = async (request, h) => {
    try {
        const { content, isAnonymous } = request.payload;
        const user = request.auth.credentials;

        if (!content) {
            return h.response({
                error: true,
                message: 'Cerita tidak boleh kosong'
            }).code(400);
        }

        const story = new Story({
            userId: user.id,
            username: isAnonymous ? 'Anonim' : user.username,
            name: isAnonymous ? 'Pengguna' : user.name,
            content,
            isAnonymous: !!isAnonymous
        });

        await story.save();
        
        if (!isAnonymous) {
            await users.findByIdAndUpdate(
                user.id,
                { 
                    $push: { 
                        stories: {
                            _id: story._id,
                            createdAt: story.createdAt
                        } 
                    } 
                },
                { new: true }
            );
        }

        return h.response({
            error: false,
            message: 'Cerita berhasil diunggah',
            data: story
        }).code(201);
    } catch (error) {
        console.error('Error createStoryHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const editStoryHandler = async (request, h) => {
    try {
        const { storyId } = request.params;
        const { content } = request.payload;
        const userId = request.auth.credentials.id;

        if (!content) {
            return h.response({
                error: true,
                message: 'Konten cerita tidak boleh kosong'
            }).code(400);
        }

        const story = await Story.findById(storyId);
        
        if (!story) {
            return h.response({
                error: true,
                message: 'Story tidak ditemukan'
            }).code(404);
        }

        if (story.userId.toString() !== userId) {
            return h.response({
                error: true,
                message: 'Anda tidak memiliki izin untuk mengedit cerita ini'
            }).code(403);
        }

        story.content = content;
        story.updatedAt = new Date();
        await story.save();

        return h.response({
            error: false,
            message: 'Cerita berhasil diperbarui',
            data: story
        }).code(200);
    } catch (error) {
        console.error('Error editStoryHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const deleteStoryHandler = async (request, h) => {
    try {
        const { storyId } = request.params;
        const userId = request.auth.credentials.id;

        const story = await Story.findById(storyId);
        
        if (!story) {
            return h.response({
                error: true,
                message: 'Story tidak ditemukan'
            }).code(404);
        }

        if (story.userId.toString() !== userId) {
            return h.response({
                error: true,
                message: 'Anda tidak memiliki izin untuk menghapus cerita ini'
            }).code(403);
        }

        for (const commentId of story.comments) {
            await deleteAllReplies(commentId);
            await Comment.findByIdAndDelete(commentId);
        }

        if (!story.isAnonymous) {
            await users.findByIdAndUpdate(
                userId,
                { $pull: { stories: { _id: storyId } } }
            );
        }

        await Story.findByIdAndDelete(storyId);

        return h.response({
            error: false,
            message: 'Cerita berhasil dihapus'
        }).code(200);
    } catch (error) {
        console.error('Error deleteStoryHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const getStoriesHandler = async (request, h) => {
    try {
        const stories = await Story.find({})
            .sort({ createdAt: -1 })
            .lean();

        const allCommentIds = stories.flatMap(story => story.comments);
        
        const directComments = await Comment.find({
            _id: { $in: allCommentIds }
        }).lean();
        
        const commentReplyCounts = {};
        
        await Promise.all(directComments.map(async (comment) => {
            const replyCount = await countAllReplies(comment._id);
            commentReplyCounts[comment._id] = replyCount;
        }));
        
        const formattedComments = directComments.map(comment => ({
            ...comment,
            likeCount: comment.likes.length,
            replyCount: commentReplyCounts[comment._id] || 0
        }));
        
        const commentMap = {};
        formattedComments.forEach(comment => {
            commentMap[comment._id.toString()] = comment;
        });
        
        const formattedStories = stories.map(story => {
            let totalCommentCount = story.comments.length;
            
            const storyComments = story.comments.map(commentId => 
                commentMap[commentId.toString()]
            ).filter(Boolean);
            
            story.comments.forEach(commentId => {
                totalCommentCount += (commentReplyCounts[commentId] || 0);
            });
            
            return {
                ...story,
                likeCount: story.likes.length,
                commentCount: story.comments.length,
                totalCommentCount: totalCommentCount,
                comments: storyComments
            };
        });

        return h.response({
            error: false,
            data: formattedStories
        }).code(200);
    } catch (error) {
        console.error('Error getStoriesHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const likeStoryHandler = async (request, h) => {
    try {
        const { storyId } = request.params;
        const userId = request.auth.credentials.id;

        const story = await Story.findById(storyId);
        if (!story) {
            return h.response({
                error: true,
                message: 'Story tidak ditemukan'
            }).code(404);
        }

        const index = story.likes.indexOf(userId);
        if (index === -1) {
            story.likes.push(userId);
        } else {
            story.likes.splice(index, 1);
        }
        await story.save();

        return h.response({
            error: false,
            message: index === -1 ? 'Story disukai' : 'Like dibatalkan',
            likeCount: story.likes.length
        }).code(200);
    } catch (error) {
        console.error('Error likeStoryHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const commentStoryHandler = async (request, h) => {
    try {
        const { storyId } = request.params;
        const { content } = request.payload;
        const user = request.auth.credentials;

        if (!content) {
            return h.response({
                error: true,
                message: 'Komentar tidak boleh kosong'
            }).code(400);
        }

        const story = await Story.findById(storyId);
        if (!story) {
            return h.response({
                error: true,
                message: 'Story tidak ditemukan'
            }).code(404);
        }

        const comment = new Comment({
            userId: user.id,
            username: user.username,
            name: user.name,
            content
        });
        
        await comment.save();
        
        story.comments.push(comment._id);
        await story.save();

        return h.response({
            error: false,
            message: 'Komentar berhasil ditambahkan',
            commentCount: story.comments.length,
            commentId: comment._id
        }).code(201);
    } catch (error) {
        console.error('Error commentStoryHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const replyCommentHandler = async (request, h) => {
    try {
        const { commentId } = request.params;
        const { content } = request.payload;
        const user = request.auth.credentials;

        if (!content) {
            return h.response({
                error: true,
                message: 'Balasan tidak boleh kosong'
            }).code(400);
        }

        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return h.response({
                error: true,
                message: 'Komentar tidak ditemukan'
            }).code(404);
        }

        const reply = new Comment({
            userId: user.id,
            username: user.username,
            name: user.name,
            content,
            parentCommentId: commentId
        });
        
        await reply.save();
        
        parentComment.replies.push(reply._id);
        await parentComment.save();
        
        let story = await Story.findOne({ comments: commentId });
        
        if (!story && parentComment.parentCommentId) {
            let originalComment = await Comment.findById(parentComment.parentCommentId);
            if (originalComment) {
                story = await Story.findOne({ comments: originalComment._id });
            }
        }
        
        return h.response({
            error: false,
            message: 'Balasan berhasil ditambahkan',
            replyId: reply._id
        }).code(201);
    } catch (error) {
        console.error('Error replyCommentHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const likeCommentHandler = async (request, h) => {
    try {
        const { commentId } = request.params;
        const userId = request.auth.credentials.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return h.response({
                error: true,
                message: 'Comment tidak ditemukan'
            }).code(404);
        }

        const index = comment.likes.indexOf(userId);
        if (index === -1) {
            comment.likes.push(userId);
        } else {
            comment.likes.splice(index, 1);
        }
        await comment.save();

        return h.response({
            error: false,
            message: index === -1 ? 'Comment disukai' : 'Like dibatalkan',
            likeCount: comment.likes.length
        }).code(200);
    } catch (error) {
        console.error('Error likeCommentHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const deleteCommentHandler = async (request, h) => {
    try {
        const { commentId } = request.params;
        const userId = request.auth.credentials.id;

        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return h.response({
                error: true,
                message: 'Komentar tidak ditemukan'
            }).code(404);
        }

        if (comment.userId.toString() !== userId) {
            return h.response({
                error: true,
                message: 'Anda tidak memiliki izin untuk menghapus komentar ini'
            }).code(403);
        }

        if (comment.parentCommentId) {
            await Comment.findByIdAndUpdate(comment.parentCommentId, {
                $pull: { replies: commentId }
            });
        } else {
            await Story.findOneAndUpdate(
                { comments: commentId },
                { $pull: { comments: commentId }}
            );
        }

        await deleteAllReplies(commentId);

        await Comment.findByIdAndDelete(commentId);

        return h.response({
            error: false,
            message: 'Komentar berhasil dihapus'
        }).code(200);
    } catch (error) {
        console.error('Error deleteCommentHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

async function deleteAllReplies(commentId) {
    const replies = await Comment.find({ parentCommentId: commentId });
    
    for (const reply of replies) {
        await deleteAllReplies(reply._id);
    }
    
    await Comment.deleteMany({ parentCommentId: commentId });
}

const getStoryDetailHandler = async (request, h) => {
    try {
        const { storyId } = request.params;

        const story = await Story.findById(storyId)
            .lean();
        
        if (!story) {
            return h.response({
                error: true,
                message: 'Story tidak ditemukan'
            }).code(404);
        }

        const comments = await Comment.find({
            _id: { $in: story.comments }
        }).lean();

        let replyCount = 0;
        for (const comment of comments) {
            replyCount += await countAllReplies(comment._id);
        }

        const relevantReplies = await Comment.find({
            parentCommentId: { $in: story.comments }
        }).lean();

        const allReplyIds = relevantReplies.map(reply => reply._id);
        let nestedReplies = [];
        
        if (allReplyIds.length > 0) {
            nestedReplies = await Comment.find({
                parentCommentId: { $in: allReplyIds }
            }).lean();
            
            let currentLevelIds = nestedReplies.map(reply => reply._id);
            
            while (currentLevelIds.length > 0) {
                const nextLevel = await Comment.find({
                    parentCommentId: { $in: currentLevelIds }
                }).lean();
                
                if (nextLevel.length === 0) break;
                
                nestedReplies = [...nestedReplies, ...nextLevel];
                currentLevelIds = nextLevel.map(reply => reply._id);
            }
        }

        const allReplies = [...relevantReplies, ...nestedReplies];
        
        comments.forEach(comment => {
            comment.likeCount = comment.likes ? comment.likes.length : 0;
        });
        
        allReplies.forEach(reply => {
            reply.likeCount = reply.likes ? reply.likes.length : 0;
        });
        
        const commentMap = {};
        comments.forEach(comment => {
            comment.replies = [];
            commentMap[comment._id.toString()] = comment;
        });

        allReplies.forEach(reply => {
            reply.replies = [];
            commentMap[reply._id.toString()] = reply;
        });

        allReplies.forEach(reply => {
            const parentId = reply.parentCommentId.toString();
            if (commentMap[parentId]) {
                commentMap[parentId].replies.push(reply);
            }
        });

        story.comments = comments.filter(c => !c.parentCommentId);

        const totalCommentCount = comments.length + allReplies.length;

        const detail = {
            ...story,
            likeCount: story.likes.length,
            commentCount: story.comments.length,
            totalCommentCount: totalCommentCount
        };

        return h.response({
            error: false,
            data: detail
        }).code(200);
    } catch (error) {
        console.error('Error getStoryDetailHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

async function countAllReplies(commentId) {
    const directReplies = await Comment.find({ parentCommentId: commentId });
    let totalReplies = directReplies.length;
    
    for (const reply of directReplies) {
        totalReplies += await countAllReplies(reply._id);
    }
    
    return totalReplies;
}

module.exports = { 
    registerHandler, 
    loginHandler, 
    getUserProfileHandler,
    editProfileHandler,
    mindTrackerHandler,
    checkMindTrackerHandler,
    getMindTrackerHandler, 
    createStoryHandler, 
    editStoryHandler,
    deleteStoryHandler,
    getStoriesHandler, 
    likeStoryHandler, 
    commentStoryHandler,
    replyCommentHandler,
    likeCommentHandler, 
    deleteCommentHandler,
    getStoryDetailHandler
};