require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: '24h'
};