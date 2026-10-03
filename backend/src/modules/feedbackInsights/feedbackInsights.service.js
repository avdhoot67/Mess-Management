const crypto = require('crypto');
const { buildFeedbackInsightsPrompt } = require('./feedbackInsights.prompt');
const {
    completeInsightQuotaReservation,
    findCachedInsight,
    getFeedbackDataset,
    releaseInsightQuotaReservation,
    reserveInsightQuota,
    saveInsight
} = require('./feedbackInsights.repository');
const { generateGeminiFeedbackInsight } = require('./providers/geminiFeedbackInsights.provider');

const MAX_ANALYSIS_DAYS = 31;
const MIN_WRITTEN_RESPONSES = 3;
const validMealTypes = new Set(['breakfast', 'lunch', 'dinner']);
const inFlightInsights = new Map();
const MAX_PROMPT_FEEDBACK_ITEMS = 50;
const MAX_PROMPT_MESSAGE_CHARS = 600;
const MAX_PROMPT_FEEDBACK_CHARS = 12000;

const toDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : null;

const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10)
    };
};

const validateScope = ({ startDate, endDate, mealType }) => {
    const defaults = getDefaultDateRange();
    const normalizedStartDate = toDateString(startDate) || defaults.startDate;
    const normalizedEndDate = toDateString(endDate) || defaults.endDate;
    const days = (new Date(`${normalizedEndDate}T00:00:00Z`) - new Date(`${normalizedStartDate}T00:00:00Z`)) / 86400000;

    if (days < 0 || days >= MAX_ANALYSIS_DAYS) {
        const error = new Error('Choose a date range of up to 31 days.');
        error.statusCode = 400;
        throw error;
    }
    if (mealType && !validMealTypes.has(mealType)) {
        const error = new Error('Choose breakfast, lunch, dinner, or all meals.');
        error.statusCode = 400;
        throw error;
    }

    return { startDate: normalizedStartDate, endDate: normalizedEndDate, mealType: mealType || null };
};

const prepareFeedbackForPrompt = (writtenFeedback) => {
    let remainingCharacters = MAX_PROMPT_FEEDBACK_CHARS;

    return writtenFeedback.slice(0, MAX_PROMPT_FEEDBACK_ITEMS).flatMap((feedback) => {
        if (remainingCharacters < 1) return [];
        const message = feedback.message.slice(0, Math.min(MAX_PROMPT_MESSAGE_CHARS, remainingCharacters));
        remainingCharacters -= message.length;
        return [{ ...feedback, message }];
    });
};

const generateFreshInsight = async ({ cacheKey, scope, adminId }) => {
    const { statistics, writtenFeedback } = await getFeedbackDataset(scope);
    if (writtenFeedback.length < MIN_WRITTEN_RESPONSES) {
        const error = new Error(`At least ${MIN_WRITTEN_RESPONSES} written feedback responses are needed before generating an insight.`);
        error.statusCode = 422;
        error.details = { ...statistics, minimum_written_responses: MIN_WRITTEN_RESPONSES };
        throw error;
    }

    const reservationId = await reserveInsightQuota({ adminId });
    try {
        const promptFeedback = prepareFeedbackForPrompt(writtenFeedback);
        const prompt = buildFeedbackInsightsPrompt({ statistics, writtenFeedback: promptFeedback, dateRange: scope, mealType: scope.mealType });
        const analysis = await generateGeminiFeedbackInsight(prompt);

        await completeInsightQuotaReservation({ reservationId });
        await saveInsight({
            cacheKey,
            ...scope,
            sampleCount: writtenFeedback.length,
            analysis,
            createdBy: adminId
        });

        return { analysis, generatedAt: new Date().toISOString(), cached: false, scope };
    } catch (error) {
        await releaseInsightQuotaReservation({ reservationId });
        throw error;
    }
};

const generateFeedbackInsight = async ({ startDate, endDate, mealType, adminId }) => {
    if (process.env.AI_PROVIDER !== 'gemini' || !process.env.GEMINI_API_KEY) {
        const error = new Error('AI feedback analysis is not configured yet.');
        error.statusCode = 503;
        throw error;
    }

    const scope = validateScope({ startDate, endDate, mealType });
    const cacheKey = crypto.createHash('sha256').update(JSON.stringify(scope)).digest('hex');
    const cachedInsight = await findCachedInsight({ cacheKey });
    if (cachedInsight) return { ...cachedInsight, cached: true, scope };

    const activeGeneration = inFlightInsights.get(cacheKey);
    if (activeGeneration) return activeGeneration;

    const generation = generateFreshInsight({ cacheKey, scope, adminId });
    inFlightInsights.set(cacheKey, generation);

    try {
        return await generation;
    } finally {
        inFlightInsights.delete(cacheKey);
    }
};

module.exports = { generateFeedbackInsight };
