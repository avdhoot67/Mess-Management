const express = require('express');

const {
    createFeedback,
    getMyFeedback,
    getAllFeedback
} = require('../controllers/feedbackController');

const authenticateToken = require('../middleware/authMiddleware');

const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();


// Submit feedback
router.post(
    '/',
    authenticateToken,
    createFeedback
);


// Get current user's feedback
router.get(
    '/',
    authenticateToken,
    getMyFeedback
);

router.get(
    '/admin',
    authenticateToken,
    authorizeRoles('admin'),
    getAllFeedback
);


module.exports = router;