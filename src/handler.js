const Bcrypt = require('bcrypt');
const JWT = require('@hapi/jwt');
const users = require('./models/user');
const mindTracker = require('./models/mindTracker');
const { key, algorithm } = require('./config/jwt');

const registerHandler = async (request, h) => {
    try {
        const { username, name, email, password } = request.payload;

        if (!username || !name || !email || !password) {
            return h.response({ 
                error: true,
                message: 'Semua field harus diisi'
            }).code(400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return h.response({ 
                error: true,
                message: 'Format email tidak valid'
            }).code(400);
        }

        const existingUser = await users.findOne({
            $or: [
                { username },
                { email }
            ]
        });


        if (existingUser) {
            if (existingUser.username === username) {
                return h.response({ 
                    error: true,
                    message: 'Username sudah terdaftar'
                }).code(400);
            }
            if (existingUser.email === email) {
                return h.response({ 
                    error: true,
                    message: 'Email sudah terdaftar'
                }).code(400);
            }
        }

        const passwordHash = await Bcrypt.hash(password, 10);

        const newUser = new users({
            username,
            name,
            email,
            passwordHash
        });

        await newUser.save();

        return h.response({
            error: false,
            message: 'Registrasi berhasil',
            data: {
                username: newUser.username,
                name: newUser.name,
                email: newUser.email
            }
        }).code(201);
    } catch (error) {
        console.error('Error registerHandler:', error);
        return h.response({ 
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const loginHandler = async (request, h) => {
    try {
        const { usernameOrEmail, password } = request.payload;

        if (!usernameOrEmail || !password) {
            return h.response({ 
                error: true,
                message: 'Username/Email dan password harus diisi'
            }).code(400);
        }

        const user = await users.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        });

        if (!user) {
            return h.response({ 
                error: true,
                message: 'Username/Email tidak ditemukan'
            }).code(404);
        }

        const validPassword = await Bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return h.response({ 
                error: true,
                message: 'Password salah'
            }).code(401);
        }

        const token = JWT.token.generate(
            {
                aud: 'urn:audience:mindblown',
                iss: 'urn:issuer:mindblown',
                sub: user._id.toString(),
                
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                name: user.name
            },
            {
                key: key,
                algorithm: algorithm
            },
            {
                ttlSec: 86400
            }
        );

        return h.response({
            error: false,
            message: 'Login berhasil',
            data: {
                name: user.name,
                username: user.username,
                email: user.email,
                token
            }
        }).code(200);
    } catch (error) {
        console.error('Error loginHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

const mindTrackerHandler = async (request, h) => {
    try {
        const { progress, mood } = request.payload;        
        const userId = request.auth.credentials.id;
        const username = request.auth.credentials.username;

        if (!progress || !mood) {
            return h.response({ 
                error: true,
                message: 'Fields progres dan mood harus diisi'
            }).code(400);
        }

        const newProgress = await mindTracker.create({
            userId: userId,
            username: username,
            progress,
            mood,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        return h.response({
            error: false,
            message: 'Progress berhasil disimpan',
            data: newProgress
        }).code(201);

    } catch (error) {
        console.error('Error mindTrackerHandler:', error);
        return h.response({ 
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

module.exports = { registerHandler, loginHandler, mindTrackerHandler };