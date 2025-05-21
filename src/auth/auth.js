const { JWT_SECRET } = require('../config/jwt');

const jwtStrategy = {
    name: 'jwt',
    keys: JWT_SECRET,
    verify: {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: 86400
    },
    validate: async (artifacts, request, h) => {
        return {
            isValid: true,
            credentials: artifacts.decoded.payload
        };
    }
};

module.exports = { jwtStrategy };