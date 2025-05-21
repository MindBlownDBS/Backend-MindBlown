const { registerHandler, loginHandler, mindTrackerHandler } = require("./handler");

const routes = [
    {
        method: 'POST',
        path: '/register',
        handler: registerHandler,
    },
    {
        method: 'POST',
        path: '/login',
        handler: loginHandler,
    },
    {
        method: 'POST',
        path: '/mindTracker',
        handler: mindTrackerHandler,
    }
];

module.exports = routes;