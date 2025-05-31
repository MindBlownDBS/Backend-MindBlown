const users = require('../models/user');
const { Story, Comment } = require('../models/story');
const Notification = require('../models/notification');
const { deleteAllReplies, countAllReplies } = require('../utils/comment-helpers');

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
            await users.updateOne(
                { _id: userId },
                { $pull: { stories: { _id: story._id } } }
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

module.exports = {
    createStoryHandler,
    editStoryHandler,
    deleteStoryHandler,
    getStoriesHandler,
    likeStoryHandler,
    getStoryDetailHandler
};