const authHandlers = require('./auth-handlers');
const userHandlers = require('./user-handlers');
const storyHandlers = require('./story-handlers');
const commentHandlers = require('./comment-handlers');
const notificationHandlers = require('./notification-handlers');
const mindTrackerHandlers = require('./mind-tracker-handlers');
const recommendationsHandlers = require('./recommendations-handlers');
const chatBotHandlers = require('./chat-bot-handlers');
const healthCheckHandler = require('./check-handlers');

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
    getCommentDetailHandler: commentHandlers.getCommentDetailHandler,
    likeCommentHandler: commentHandlers.likeCommentHandler,
    deleteCommentHandler: commentHandlers.deleteCommentHandler,
    
    // Notification handlers
    sendPushNotification: notificationHandlers.sendPushNotification,
    subscribePushHandler: notificationHandlers.subscribePushHandler,
    unsubscribePushHandler: notificationHandlers.unsubscribePushHandler,
    getNotificationsHandler: notificationHandlers.getNotificationsHandler,
    markNotificationReadHandler: notificationHandlers.markNotificationReadHandler,
    markAllNotificationsReadHandler: notificationHandlers.markAllNotificationsReadHandler,
    
    // MindTracker handlers
    mindTrackerHandler: mindTrackerHandlers.mindTrackerHandler,
    checkMindTrackerHandler: mindTrackerHandlers.checkMindTrackerHandler,
    getMindTrackerHandler: mindTrackerHandlers.getMindTrackerHandler,
    getMonthlyTrackerHandler: mindTrackerHandlers.getMonthlyTrackerHandler,
    triggerMindTrackerRemindersHandler: mindTrackerHandlers.triggerMindTrackerRemindersHandler,

    // Recommendations handlers
    getRecommendationsHandler: recommendationsHandlers.getRecommendationsHandler,
    regenerateRecommendationsHandler: recommendationsHandlers.regenerateRecommendationsHandler,

    // ChatBot handlers
    getChatHistoryHandler: chatBotHandlers.getChatHistoryHandler,
    testChatBotHandler: chatBotHandlers.testChatBotHandler,

    // Health check handler
    rootHandler: healthCheckHandler.rootHandler,
    healthCheckHandler: healthCheckHandler.healthCheckHandler
};