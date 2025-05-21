const { registerHandler, loginHandler, mindTrackerHandler } = require("./handler");

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
    }
];

module.exports = routes;