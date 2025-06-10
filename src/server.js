const Hapi = require('@hapi/hapi');
const JWT = require('@hapi/jwt');
const routes = require('./routes');
const connectDB = require('./db');
const { jwtStrategy } = require('./auth/auth');
const { initScheduler } = require('./services/scheduler');
const { initializeChatbotWebSocket } = require('./handlers/chat-bot-handlers');

const init = async () => {
    await connectDB();
    const server = Hapi.server({
        port: 5000,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    await server.register(JWT);
    server.auth.strategy('jwt', jwtStrategy.scheme, jwtStrategy.options);
    server.auth.default('jwt');

    initScheduler();
    
    server.route(routes);

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);

    const wss = initializeChatbotWebSocket(server.listener);
    console.log('Chatbot WebSocket server initialized on ws://localhost:5000/chatbot-ws');

    return server;
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();