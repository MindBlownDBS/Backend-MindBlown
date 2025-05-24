const { registerHandler, loginHandler, mindTrackerHandler, checkMindTrackerHandler, getMindTrackerHandler } = require("./handler");

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
    }
];

module.exports = routes;