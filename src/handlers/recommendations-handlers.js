const Recommendation = require('../models/recommendations');
const User = require('../models/user');
const { regenerateUserRecommendations } = require('../services/recommendations');

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

const regenerateRecommendationsHandler = async (request, h) => {
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
        
        const existingRecommendation = await Recommendation.findOne({ userId: user._id });
        
        if (!existingRecommendation) {
            return h.response({
                error: true,
                message: 'Belum ada rekomendasi untuk user ini'
            }).code(404);
        }
        
        const regenerationResult = await regenerateUserRecommendations(user._id, user.preferences);
        
        if (!regenerationResult.success) {
            return h.response({
                error: true,
                message: `Gagal regenerasi rekomendasi: ${regenerationResult.error}`
            }).code(500);
        }
        
        await regenerationResult.data.populate('userId', 'username name email');
        
        return h.response({
            error: false,
            message: 'Rekomendasi berhasil di-regenerasi',
            data: {
                userId: regenerationResult.data.userId._id,
                username: regenerationResult.data.userId.username,
                name: regenerationResult.data.userId.name,
                regeneratedAt: new Date()
            }
        }).code(200);
        
    } catch (error) {
        console.error('Error regenerateRecommendationsHandler:', error);
        return h.response({
            error: true,
            message: 'Terjadi kesalahan server'
        }).code(500);
    }
};

module.exports = {
    getRecommendationsHandler,
    regenerateRecommendationsHandler
};