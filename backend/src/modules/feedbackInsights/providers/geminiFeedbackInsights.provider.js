const { GoogleGenAI } = require('@google/genai');
const { feedbackInsightSchema, isValidFeedbackInsight } = require('../feedbackInsights.schema');

const generateGeminiFeedbackInsight = async ({ instructions, input }) => {
    if (!process.env.GEMINI_API_KEY) {
        const error = new Error('Gemini feedback analysis is not configured yet.');
        error.statusCode = 503;
        throw error;
    }

    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        contents: input,
        config: {
            systemInstruction: instructions,
            responseMimeType: 'application/json',
            responseJsonSchema: feedbackInsightSchema
        }
    });

    if (!response.text) {
        const error = new Error('Gemini did not return a usable analysis.');
        error.statusCode = 502;
        throw error;
    }

    let analysis;
    try {
        analysis = JSON.parse(response.text);
    } catch {
        const error = new Error('Gemini returned an invalid analysis format.');
        error.statusCode = 502;
        throw error;
    }

    if (!isValidFeedbackInsight(analysis)) {
        const error = new Error('Gemini returned an incomplete analysis format.');
        error.statusCode = 502;
        throw error;
    }

    return analysis;
};

module.exports = { generateGeminiFeedbackInsight };
