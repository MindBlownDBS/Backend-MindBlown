const { privateKey } = require('../config/jwt');

const jwtStrategy = {
    scheme: 'jwt',
    options: {
        keys: privateKey,
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
    }
};

module.exports = { jwtStrategy };