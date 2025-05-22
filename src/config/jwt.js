const crypto = require('crypto');

try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    module.exports = {
        publicKey,
        privateKey,
        algorithm: 'RS256',
        expiresIn: '24h'
    };
} catch (error) {
    console.error('Error generating JWT keys:', error);
    process.exit(1);
}