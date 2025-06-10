const rootHandler = (request, h) => {
    return h.response({
        message: 'MindBlown API berjalan',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: {
                register: '/register',
                login: '/login'
            },
            api: '/api-docs'
        }
    }).code(200);
};

const healthCheckHandler = (request, h) => {
    return h.response({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
    }).code(200);
};

module.exports = {
    rootHandler,
    healthCheckHandler
};