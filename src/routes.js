const { 
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
    getStoryDetailHandler,
    getNotificationsHandler,
    markNotificationReadHandler,
    markAllNotificationsReadHandler,
    triggerMindTrackerRemindersHandler
} = require("./handlers/handler");

const routes = [
    {
        method: 'POST',
        path: '/register',
        handler: registerHandler,
        options: {
            auth: false,
        }
    },
    {
        method: 'POST',
        path: '/login',
        handler: loginHandler,
        options: {
            auth: false,
        }
    },
    {
        method: 'GET',
        path: '/profile/{username}',
        handler: getUserProfileHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'PUT',
        path: '/profile',
        handler: editProfileHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'POST',
        path: '/mind-tracker',
        handler: mindTrackerHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'GET',
        path: '/mind-tracker/check/{date}',
        handler: checkMindTrackerHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'GET',
        path: '/mind-tracker/{date}',
        handler: getMindTrackerHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'POST',
        path: '/stories',
        handler: createStoryHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'PUT',
        path: '/stories/{storyId}',
        handler: editStoryHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'DELETE',
        path: '/stories/{storyId}',
        handler: deleteStoryHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'GET',
        path: '/stories',
        handler: getStoriesHandler,
        options: {
            auth: false,
        }
    },
    {
        method: 'GET',
        path: '/stories/{storyId}',
        handler: getStoryDetailHandler,
        options: {
            auth: false,
        }
    },
    {
        method: 'POST',
        path: '/stories/{storyId}/likes',
        handler: likeStoryHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'POST',
        path: '/stories/{storyId}/comments',
        handler: commentStoryHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'POST',
        path: '/comments/{commentId}/replies',
        handler: replyCommentHandler,
        options: {
            auth: 'jwt',
        }
    },
        {
        method: 'POST',
        path: '/comments/{commentId}/likes',
        handler: likeCommentHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'DELETE',
        path: '/comments/{commentId}',
        handler: deleteCommentHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'GET',
        path: '/notifications',
        handler: getNotificationsHandler,
        options: {
            auth: 'jwt'
        }
    },
    {
        method: 'PUT',
        path: '/notifications/{notificationId}/read',
        handler: markNotificationReadHandler,
        options: {
            auth: 'jwt'
        }
    },
    {
        method: 'PUT',
        path: '/notifications',
        handler: markAllNotificationsReadHandler,
        options: {
            auth: 'jwt'
        }
    },
    {
        method: 'POST',
        path: '/admin/trigger-mindtracker-reminders',
        handler: triggerMindTrackerRemindersHandler,
        options: {
            auth: 'jwt'
        }
    }
];

module.exports = routes;