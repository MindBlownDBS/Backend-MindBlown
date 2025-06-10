require('dotenv').config();

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS256';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

console.log('Environment check:', {
    hasJwtSecret: !!jwtSecretKey,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
});

if (!jwtSecretKey) {
    console.error('JWT_SECRET_KEY environment variable is not set');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));
    process.exit(1);
}

module.exports = {
    key: jwtSecretKey,
    algorithm: jwtAlgorithm,
    expiresIn: jwtExpiresIn,
};