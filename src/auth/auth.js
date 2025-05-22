const { key } = require('../config/jwt');

const jwtStrategy = {
    scheme: 'jwt',
    options: {
        keys: key,
        verify: {
            aud: false,
            iss: false,
            sub: false,
            maxAgeSec: 86400
        },
        validate: async (artifacts) => {
            return {
                isValid: true,
                credentials: artifacts.decoded.payload
            };
        }
    }
};

module.exports = { jwtStrategy };