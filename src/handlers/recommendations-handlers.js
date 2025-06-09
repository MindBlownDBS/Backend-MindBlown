const Recommendation = require('../models/recommendations');
const User = require('../models/user');

const getRecommendationsHandler = async (request, h) => {
    try {
        const { username } = request.params;
        
        if (!username) {
            return h.response({
                error: true,
                message: 'Username diperlukan'
            }).code(400);
        }
        
        const user = await User.findOne({ username });
        
        if (!user) {
            return h.response({
                error: true,
                message: 'User tidak ditemukan'
            }).code(404);
        }
        
        const recommendations = await Recommendation.findOne({ userId: user._id })
            .populate('userId', 'username name email')
            .sort({ createdAt: -1 });
        
        if (!recommendations) {
            return h.response({
                error: false,
                message: 'Belum ada rekomendasi untuk user ini',
                data: null
            }).code(200);
        }
        
        return h.response({
            error: false,
            message: 'Rekomendasi berhasil diambil',
            data: {
                userId: recommendations.userId._id,
                username: recommendations.userId.username,
                name: recommendations.userId.name,
                initialActivity: recommendations.initialActivity,
                recommendations: recommendations.recommendations,
                createdAt: recommendations.createdAt
            }
        }).code(200);
        
    } catch (error) {
        console.error('Error getRecommendationsHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

module.exports = {
    getRecommendationsHandler
};