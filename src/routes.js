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
    getStoryDetailHandler
} = require("./handler");

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
        options: {
            auth: 'jwt',
            handler: getUserProfileHandler
        }
    },
    {
        method: 'PUT',
        path: '/profile',
        options: {
            auth: 'jwt',
            handler: editProfileHandler
        }
    },
    {
        method: 'POST',
        path: '/mindTracker',
        handler: mindTrackerHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'GET',
        path: '/mindTracker/check/{date}',
        handler: checkMindTrackerHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'GET',
        path: '/mindTracker/{date}',
        handler: getMindTrackerHandler,
        options: {
            auth: 'jwt',
        }
    },
    {
        method: 'POST',
        path: '/story',
        options: {
            auth: 'jwt',
            handler: createStoryHandler
        }
    },
    {
        method: 'PUT',
        path: '/story/{storyId}',
        options: {
            auth: 'jwt',
            handler: editStoryHandler
        }
    },
    {
        method: 'DELETE',
        path: '/story/{storyId}',
        options: {
            auth: 'jwt',
            handler: deleteStoryHandler
        }
    },
    {
        method: 'GET',
        path: '/story',
        handler: getStoriesHandler
    },
    {
        method: 'GET',
        path: '/story/{storyId}',
        handler: getStoryDetailHandler
    },
    {
        method: 'POST',
        path: '/story/{storyId}/like',
        options: {
            auth: 'jwt',
            handler: likeStoryHandler
        }
    },
    {
        method: 'POST',
        path: '/story/{storyId}/comment',
        options: {
            auth: 'jwt',
            handler: commentStoryHandler
        }
    },
    {
        method: 'POST',
        path: '/comment/{commentId}/reply',
        options: {
            auth: 'jwt',
            handler: replyCommentHandler
        }
    },
        {
        method: 'POST',
        path: '/comment/{commentId}/like',
        options: {
            auth: 'jwt',
            handler: likeCommentHandler
        }
    },
    {
        method: 'DELETE',
        path: '/comment/{commentId}',
        options: {
            auth: 'jwt',
            handler: deleteCommentHandler
        }
    },
    {
        method: 'GET',
        path: '/notifications',
        handler: handlers.getNotificationsHandler,
        options: {
            auth: 'jwt'
        }
    },

    {
        method: 'PUT',
        path: '/notifications/{notificationId}',
        handler: handlers.markNotificationReadHandler,
        options: {
            auth: 'jwt'
        }
    },

    {
        method: 'PUT',
        path: '/notifications',
        handler: handlers.markAllNotificationsReadHandler,
        options: {
            auth: 'jwt'
        }
    }
];

module.exports = routes;