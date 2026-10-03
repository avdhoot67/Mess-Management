const feedbackInsightSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'sentiment',
        'executive_summary',
        'trend',
        'themes',
        'meal_type_insights',
        'recommendations',
        'limitations'
    ],
    properties: {
        sentiment: {
            type: 'string',
            enum: ['positive', 'mixed', 'negative', 'insufficient_data']
        },
        executive_summary: { type: 'string', maxLength: 500 },
        trend: { type: 'string', maxLength: 280 },
        themes: {
            type: 'array',
            maxItems: 5,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['label', 'sentiment', 'prevalence', 'summary'],
                properties: {
                    label: { type: 'string', maxLength: 60 },
                    sentiment: { type: 'string', enum: ['praise', 'complaint', 'mixed'] },
                    prevalence: { type: 'string', enum: ['recurring', 'occasional'] },
                    summary: { type: 'string', maxLength: 220 }
                }
            }
        },
        meal_type_insights: {
            type: 'array',
            maxItems: 3,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['meal_type', 'summary'],
                properties: {
                    meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner'] },
                    summary: { type: 'string', maxLength: 220 }
                }
            }
        },
        recommendations: {
            type: 'array',
            maxItems: 3,
            items: { type: 'string', maxLength: 220 }
        },
        limitations: { type: 'string', maxLength: 280 }
    }
};

const isValidFeedbackInsight = (analysis) => {
    if (!analysis || typeof analysis !== 'object') return false;

    return typeof analysis.sentiment === 'string'
        && typeof analysis.executive_summary === 'string'
        && typeof analysis.trend === 'string'
        && Array.isArray(analysis.themes)
        && Array.isArray(analysis.meal_type_insights)
        && Array.isArray(analysis.recommendations)
        && typeof analysis.limitations === 'string';
};

module.exports = { feedbackInsightSchema, isValidFeedbackInsight };
