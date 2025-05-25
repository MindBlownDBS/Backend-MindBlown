const { 
    registerHandler, 
    loginHandler, 
    mindTrackerHandler,
    checkMindTrackerHandler,
    getMindTrackerHandler, 
    createStoryHandler, 
    editStoryHandler,
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
        path: '/stories',
        options: {
            auth: 'jwt',
            handler: createStoryHandler
        }
    },
    {
        method: 'PUT',
        path: '/stories/{storyId}',
        options: {
            auth: 'jwt',
            handler: editStoryHandler
        }
    },
    {
        method: 'GET',
        path: '/stories',
        handler: getStoriesHandler
    },
    {
        method: 'POST',
        path: '/stories/{storyId}/like',
        options: {
            auth: 'jwt',
            handler: likeStoryHandler
        }
    },
    {
        method: 'POST',
        path: '/stories/{storyId}/comment',
        options: {
            auth: 'jwt',
            handler: commentStoryHandler
        }
    },
    {
        method: 'POST',
        path: '/comments/{commentId}/reply',
        options: {
            auth: 'jwt',
            handler: replyCommentHandler
        }
    },
        {
        method: 'POST',
        path: '/comments/{commentId}/like',
        options: {
            auth: 'jwt',
            handler: likeCommentHandler
        }
    },
    {
        method: 'DELETE',
        path: '/comments/{commentId}',
        options: {
            auth: 'jwt',
            handler: deleteCommentHandler
        }
    },
    {
        method: 'GET',
        path: '/stories/{storyId}',
        handler: getStoryDetailHandler
    }
];

module.exports = routes;