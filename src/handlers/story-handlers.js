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
        const userId = request.auth.credentials.id;

        const stories = await Story.find({})
            .sort({ createdAt: -1 })
            .lean();

        const allStoryIds = stories.map(story => story._id);
        
        const commentCounts = await Promise.all(
            allStoryIds.map(async (storyId) => {
                const storyWithComments = await Story.findById(storyId).select('comments').lean();
                const directCommentCount = storyWithComments.comments.length;
                
                let totalReplyCount = 0;
                for (const commentId of storyWithComments.comments) {
                    totalReplyCount += await countAllReplies(commentId);
                }
                
                return {
                    storyId: storyId.toString(),
                    commentCount: directCommentCount,
                    totalCommentCount: directCommentCount + totalReplyCount
                };
            })
        );

        const commentCountMap = {};
        commentCounts.forEach(item => {
            commentCountMap[item.storyId] = {
                commentCount: item.commentCount,
                totalCommentCount: item.totalCommentCount
            };
        });

        const likeCountMap = {};
        likeCounts.forEach(item => {
            likeCountMap[item._id.toString()] = item.likeCount;
        });

        // Get user's liked stories
        const userLikedStories = await Story.find(
            { 'likes.userId': userId },
            { _id: 1 }
        ).lean();
        
        const userLikedMap = {};
        userLikedStories.forEach(story => {
            userLikedMap[story._id.toString()] = true;
        });

        const formattedStories = stories.map(story => {
            const storyId = story._id.toString();
            const commentData = commentCountMap[storyId] || { commentCount: 0, totalCommentCount: 0 };
            
            // Check if current user has liked this story
            const isLiked = userId && story.likes ? 
                story.likes.some(like => like.userId && like.userId.toString() === userId) : 
                false
            ;
            
            const likeCount = story.likes ? story.likes.length : 0;
            
            return {
                _id: story._id,
                userId: story.userId,
                username: story.username,
                name: story.name,
                content: story.content,
                isAnonymous: story.isAnonymous,
                createdAt: story.createdAt,
                updatedAt: story.updatedAt,
                viewCount: story.viewCount,
                likeCount: likeCount,
                isLiked: isLiked,
                commentCount: commentData.commentCount,
                totalCommentCount: commentData.totalCommentCount,
                userLiked: userLikedMap[storyId] || false
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

        story.likes = story.likes.filter(like => like && like.userId);

        const existingLikeIndex = story.likes.findIndex(like => 
            like.userId && like.userId.toString() === userId
        );
        let userLiked;
        
        if (existingLikeIndex === -1) {
            story.likes.push({
                userId: userId,
                createdAt: new Date()
            });
            userLiked = true;
        } else {
            story.likes.splice(existingLikeIndex, 1);
            userLiked = false;
        }
        
        await story.save();

        const formattedLikes = story.likes
            .filter(like => like && like.userId)
            .map(like => ({
                userId: like.userId,
                createdAt: like.createdAt.toISOString()
            }));

        return h.response({
            status: "success",
            message: userLiked ? 'Story berhasil disukai' : 'Like story berhasil dihapus',
            data: {
                story: {
                    id: story._id,
                    content: story.content,
                    likeCount: story.likes.length,
                    userLiked: userLiked,
                    likes: formattedLikes
                }
            }
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
        const userId = request.auth.credentials.id;
        
        // Check if user is authenticated
        if (!request.auth.credentials || !request.auth.credentials.id) {
            return h.response({
                error: true,
                message: 'Unauthorized - Authentication required'
            }).code(401);
        }        

        if (!storyId || storyId === 'undefined') {
            return h.response({
                error: true,
                message: 'ID story tidak valid'
            }).code(400);
        }

        let story = await Story.findById(storyId)
            .select('-viewedBy')
            .lean();
        
        if (!story) {
            return h.response({
                error: true,
                message: 'Story tidak ditemukan'
            }).code(404);
        }
        
        // Get the full story data for view tracking and like counting
        const fullStory = await Story.findById(storyId)
            .select('likes viewedBy viewCount')
            .lean()
        ;
        
        // Check if user has already viewed this story
        const hasViewed = fullStory.viewedBy && fullStory.viewedBy.some(viewerId => viewerId.toString() === userId);
        
        // Only increment view count if user hasn't viewed before
        if (!hasViewed) {
            await Story.findByIdAndUpdate(
                storyId,
                { 
                    $inc: { viewCount: 1 },
                    $addToSet: { viewedBy: userId }
                }
            );
            story.viewCount = (story.viewCount || 0) + 1;
        }

        const userLiked = fullStory.likes && fullStory.likes.some(like => 
            like.userId && like.userId.toString() === userId
        );

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
            comment.repliesCount = 0;
            allReplies.forEach(reply => {
                if (reply.parentCommentId && reply.parentCommentId.toString() === comment._id.toString()) {
                    comment.repliesCount++;
                }
            });
            comment.likeCount = comment.likes ? comment.likes.length : 0;
            comment.isLiked = comment.likes ? 
                comment.likes.some(like => like.userId && like.userId.toString() === userId) : 
                false;
            delete comment.likes;
        });
        
        allReplies.forEach(reply => {
            reply.repliesCount = 0;
            allReplies.forEach(nestedReply => {
                if (nestedReply.parentCommentId && nestedReply.parentCommentId.toString() === reply._id.toString()) {
                    reply.repliesCount++;
                }
            });
            reply.likeCount = reply.likes ? reply.likes.length : 0;
            reply.isLiked = reply.likes ? 
                reply.likes.some(like => like.userId && like.userId.toString() === userId) : 
                false;
            delete reply.likes;
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

        // Check if current user has liked this story
        const isLiked = story.likes ? 
            story.likes.some(like => like.userId && like.userId.toString() === userId) : 
            false
        ;

        const detail = {
            ...story,
            likeCount: story.likes ? story.likes.length : 0,
            isLiked: isLiked,
            commentCount: story.comments.length,
            totalCommentCount: totalCommentCount,
            userLiked: userLiked,
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