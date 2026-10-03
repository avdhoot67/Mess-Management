const { generateFeedbackInsight } = require('../modules/feedbackInsights/feedbackInsights.service');

const generateInsight = async (req, res) => {
    try {
        const result = await generateFeedbackInsight({
            startDate: req.body?.start_date,
            endDate: req.body?.end_date,
            mealType: req.body?.meal_type,
            adminId: req.user.user_id
        });

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('Generate feedback insight error:', error.message);
        const statusCode = error.statusCode || error.status || 500;
        const isSafeProviderError = statusCode >= 400 && statusCode < 500;

        res.status(statusCode).json({
            success: false,
            message: error.statusCode || isSafeProviderError
                ? error.message
                : 'Unable to generate feedback insight right now.',
            details: error.details
        });
    }
};

module.exports = { generateInsight };
