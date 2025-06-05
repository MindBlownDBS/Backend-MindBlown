const { Story, Comment } = require('../models/story');
const Notification = require('../models/notification');
const { deleteAllReplies } = require('../utils/comment-helpers');
const { sendPushNotification } = require('./notification-handlers');

const commentStoryHandler = async (request, h) => {
    try {
        const { storyId } = request.params;

        if (!storyId || storyId === 'undefined') {
            return h.response({
                error: true,
                message: 'ID story tidak valid'
            }).code(400);
        }
        
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

        // Create notification if the commenter is not the story owner
        if (user.id !== story.userId.toString()) {
            const notification = new Notification({
                userId: story.userId,
                fromUserId: user.id,
                fromUsername: user.username,
                type: 'comment',
                message: `${user.username} berkomentar di story-mu.`,
                storyId: story._id,
                commentId: comment._id
            });
            await notification.save();

            // Send push notification
            await sendPushNotification(
                story.userId,
                'Komentar Baru',
                `${user.username} berkomentar di story-mu.`,
            );
        }

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

        // Create notification if the replier is not the comment owner
        if (user.id !== parentComment.userId.toString()) {
            const notification = new Notification({
                userId: parentComment.userId,
                fromUserId: user.id,
                fromUsername: user.username,
                type: 'reply',
                message: `${user.username} membalas komentarmu.`,
                storyId: story ? story._id : null,
                commentId: reply._id
            });
            await notification.save();

            // Send push notification
            await sendPushNotification(
                parentComment.userId,
                'Balasan Baru',
                `${user.username} membalas komentarmu.`,
            );
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

const getCommentDetailHandler = async (request, h) => {
    try {
        const { commentId } = request.params;

        if (!commentId || commentId === 'undefined') {
            return h.response({
                error: true,
                message: 'ID komentar tidak valid'
            }).code(400);
        }

        // Recursive population of replies
        const comment = await Comment.findById(commentId).populate({
            path: 'replies',
            populate: {
                path: 'replies',
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'replies',
                        options: { sort: { createdAt: 1 } }
                    },
                    options: { sort: { createdAt: 1 } }
                },
                options: { sort: { createdAt: 1 } }
            },
            options: { sort: { createdAt: 1 } }
        });

        if (!comment) {
            return h.response({
                error: true,
                message: 'Komentar tidak ditemukan'
            }).code(404);
        }

        // Find the story this comment belongs to
        let story = null;
        if (comment.parentCommentId) {
            // This is a reply, find the original comment's story
            const originalComment = await Comment.findById(comment.parentCommentId);
            if (originalComment) {
                story = await Story.findOne({ comments: originalComment._id });
            }
        } else {
            // This is a main comment
            story = await Story.findOne({ comments: commentId });
        }

        // Helper function to format replies recursively
        const formatReplies = (replies) => {
            return replies.map(reply => ({
                _id: reply._id,
                userId: reply.userId,
                username: reply.username,
                name: reply.name,
                content: reply.content,
                parentCommentId: reply.parentCommentId,
                replies: formatReplies(reply.replies || []),
                createdAt: reply.createdAt,
                updatedAt: reply.updatedAt,
                __v: reply.__v,
                repliesCount: reply.replies ? reply.replies.length : 0,
                likeCount: reply.likes ? reply.likes.length : 0
            }));
        };

        const commentDetail = {
            _id: comment._id,
            userId: comment.userId,
            username: comment.username,
            name: comment.name,
            content: comment.content,
            parentCommentId: comment.parentCommentId,
            replies: formatReplies(comment.replies || []),
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            __v: comment.__v,
            repliesCount: comment.replies ? comment.replies.length : 0,
            likeCount: comment.likes ? comment.likes.length : 0,
            storyId: story ? story._id : null,
            storyTitle: story ? story.title : null
        };

        return h.response({
            error: false,
            message: 'Detail komentar berhasil diambil',
            data: commentDetail
        }).code(200);
    } catch (error) {
        console.error('Error getCommentDetailHandler:', error);
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

module.exports = {
    commentStoryHandler,
    replyCommentHandler,
    getCommentDetailHandler,
    likeCommentHandler,
    deleteCommentHandler
};