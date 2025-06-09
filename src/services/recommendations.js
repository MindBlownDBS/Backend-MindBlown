const Recommendation = require('../models/recommendations');

const ML_API_BASE_URL = 'https://sistem-rekomendasi-api-971022656495.us-central1.run.app';

const generateUserRecommendations = async (userId, preferences) => {
    try {
        const categoriesParam = preferences.map(pref => pref.toLowerCase()).join(',');
        
        const startActivityUrl = `${ML_API_BASE_URL}/get-start-activity?category=${encodeURIComponent(categoriesParam)}`;
        const startActivityResponse = await fetch(startActivityUrl);
        
        if (!startActivityResponse.ok) {
            throw new Error(`Failed to fetch initial activity: ${startActivityResponse.status} ${startActivityResponse.statusText}`);
        }
        
        const initialActivityData = await startActivityResponse.json();
        
        if (!initialActivityData || !initialActivityData.name) {
            throw new Error('Failed to get initial activity from ML API');
        }
        
        const initialActivity = initialActivityData;
        
        const recommendUrl = `${ML_API_BASE_URL}/recommend/content-based?activity_name=${encodeURIComponent(initialActivity.name)}&top_n=5`;
        const recommendResponse = await fetch(recommendUrl);
        
        if (!recommendResponse.ok) {
            throw new Error(`Failed to fetch recommendations: ${recommendResponse.status} ${recommendResponse.statusText}`);
        }
        
        const recommendData = await recommendResponse.json();
        
        if (!recommendData || !recommendData.top_recommendations) {
            throw new Error('Failed to get recommendations from ML API');
        }
        
        const topRecommendations = recommendData.top_recommendations;
        
        const recommendation = new Recommendation({
            userId,
            initialActivity: {
                activityId: initialActivity.activityId,
                category: initialActivity.category,
                duration: initialActivity.duration,
                energy_needed: initialActivity.energy_needed,
                features: initialActivity.features,
                name: initialActivity.name
            },
            recommendations: topRecommendations.map(rec => ({
                category: rec.category,
                duration: rec.duration,
                energy_needed: rec.energy_needed,
                name: rec.name,
                similarity_score: rec.similarity_score
            }))
        });
        
        await recommendation.save();
        
        return {
            success: true,
            data: recommendation
        };
        
    } catch (error) {
        console.error('Error generating user recommendations:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    generateUserRecommendations
};