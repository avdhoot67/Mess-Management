const express = require('express');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { generateInsight } = require('../controllers/feedbackInsightsController');

const router = express.Router();

const insightIpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many insight requests. Please try again later.' }
});

const insightAdminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `admin:${req.user.user_id}`,
    message: { success: false, message: 'Too many insight requests. Please try again later.' }
});

router.post('/generate', authenticateToken, authorizeRoles('admin'), insightIpLimiter, insightAdminLimiter, generateInsight);

module.exports = router;
