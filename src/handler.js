const Bcrypt = require('bcrypt');
const users = require('./models/user')

const registerHandler = async (request, h) => {
    try {
        const { username, name, email, password } = request.payload;

        if (!username || !name || !email || !password) {
            return h.response({ error: 'Semua field harus diisi' }).code(400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return h.response({ error: 'Format email tidak valid' }).code(400);
        }

        const existingUser = await users.findOne({
            $or: [
                { username },
                { email }
            ]
        });


        if (existingUser) {
            if (existingUser.username === username) {
                return h.response({ error: 'Username sudah terdaftar' }).code(400);
            }
            if (existingUser.email === email) {
                return h.response({ error: 'Email sudah terdaftar' }).code(400);
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
            message: 'Registrasi berhasil',
            data: {
                username: newUser.username,
                name: newUser.name,
                email: newUser.email
            }
        }).code(201);
    } catch (error) {
        console.error('Error registerHandler:', error);
        return h.response({ error: 'Terjadi kesalahan server' }).code(500);
    }
}

const loginHandler = async (request, h) => {
    try {
        const { usernameOrEmail, password } = request.payload;

        if (!usernameOrEmail || !password) {
            return h.response({ error: 'Username/Email dan password harus diisi' }).code(400);
        }

        const user = await users.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        });

        if (!user) {
            return h.response({ error: 'Username/Email tidak ditemukan' }).code(404);
        }

        const validPassword = await Bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return h.response({ error: 'Password salah' }).code(401);
        }

        return h.response({
            message: 'Login berhasil',
            data: {
                name: user.name,
                username: '@' + user.username,
                email: user.email
            },
        }).code(200);
    } catch (error) {
        console.error('Error loginHandler:', error);
        return h.response({ error: 'Terjadi kesalahan server' }).code(500);
    }
};

module.exports = { registerHandler, loginHandler };