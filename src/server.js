const Hapi = require('@hapi/hapi');
const JWT = require('@hapi/jwt');
const routes = require('./routes');
const { privateKey } = require('./config/jwt');
const connectDB = require('./db');
const { jwtStrategy } = require('./auth/auth');

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
    
    server.route(routes);

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();