const authHandlers = require('./auth-handlers');
const userHandlers = require('./user-handlers');
const storyHandlers = require('./story-handlers');
const commentHandlers = require('./comment-handlers');
const notificationHandlers = require('./notification-handlers');
const mindTrackerHandlers = require('./mind-tracker-handlers');

module.exports = {
    // Auth handlers
    registerHandler: authHandlers.registerHandler,
    loginHandler: authHandlers.loginHandler,
    
    // User handlers
    getUserProfileHandler: userHandlers.getUserProfileHandler,
    editProfileHandler: userHandlers.editProfileHandler,
    
    // Story handlers
    createStoryHandler: storyHandlers.createStoryHandler,
    editStoryHandler: storyHandlers.editStoryHandler,
    deleteStoryHandler: storyHandlers.deleteStoryHandler,
    getStoriesHandler: storyHandlers.getStoriesHandler,
    likeStoryHandler: storyHandlers.likeStoryHandler,
    getStoryDetailHandler: storyHandlers.getStoryDetailHandler,
    
    // Comment handlers
    commentStoryHandler: commentHandlers.commentStoryHandler,
    replyCommentHandler: commentHandlers.replyCommentHandler,
    likeCommentHandler: commentHandlers.likeCommentHandler,
    deleteCommentHandler: commentHandlers.deleteCommentHandler,
    
    // Notification handlers
    getNotificationsHandler: notificationHandlers.getNotificationsHandler,
    markNotificationReadHandler: notificationHandlers.markNotificationReadHandler,
    markAllNotificationsReadHandler: notificationHandlers.markAllNotificationsReadHandler,
    
    // MindTracker handlers
    mindTrackerHandler: mindTrackerHandlers.mindTrackerHandler,
    checkMindTrackerHandler: mindTrackerHandlers.checkMindTrackerHandler,
    getMindTrackerHandler: mindTrackerHandlers.getMindTrackerHandler,
    triggerMindTrackerRemindersHandler: mindTrackerHandlers.triggerMindTrackerRemindersHandler
};