const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    register,
    login,
    startGoogleLogin,
    startGoogleLink,
    googleCallback,
    completeGoogleLogin,
    refreshSession,
    logout,
    getAccount,
    updatePhone
} = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordResetController');


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const googleAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many Google authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: {
        success: false,
        message: 'Too many session refresh requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again later.'
    }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset requests. Please try again later.'
    }
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many reset attempts. Please try again later.'
    }
});

const router = express.Router();

router.post('/register', registrationLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, requestPasswordReset);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.get('/google', googleAuthLimiter, startGoogleLogin);
router.post('/google/link', googleAuthLimiter, authenticateToken, startGoogleLink);
router.get('/google/callback', googleCallback);
router.post('/google/session', googleAuthLimiter, completeGoogleLogin);
router.post('/refresh', refreshLimiter, refreshSession);
router.post('/logout', logout);
router.get('/account', authenticateToken, getAccount);
router.patch('/account/phone', authenticateToken, updatePhone);

module.exports = router;
