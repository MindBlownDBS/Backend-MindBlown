const { Comment } = require('../models/story');

async function deleteAllReplies(commentId) {
    const replies = await Comment.find({ parentCommentId: commentId });
    
    for (const reply of replies) {
        await deleteAllReplies(reply._id);
    }
    
    await Comment.deleteMany({ parentCommentId: commentId });
}

async function countAllReplies(commentId) {
    const directReplies = await Comment.find({ parentCommentId: commentId });
    let totalReplies = directReplies.length;
    
    for (const reply of directReplies) {
        totalReplies += await countAllReplies(reply._id);
    }
    
    return totalReplies;
}

module.exports = {
    deleteAllReplies,
    countAllReplies
};