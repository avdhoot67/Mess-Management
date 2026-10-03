const express = require('express');

const {
    createSubscription,
    getMySubscriptions,
    getAllSubscriptions
} = require('../controllers/subscriptionController');

const authenticateToken = require('../middleware/authMiddleware');

const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
    '/',
    authenticateToken,
    createSubscription
);

router.get(
    '/',
    authenticateToken,
    getMySubscriptions
);

router.get(
    '/admin',
    authenticateToken,
    authorizeRoles('admin'),
    getAllSubscriptions
);

module.exports = router;