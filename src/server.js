const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const connectDB = require('./db');

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

    server.route(routes);

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
};

init();