const express = require('express');

const {
    getPlans,
    createPlan,
    updatePlan
} = require('../controllers/planController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Public
router.get('/', getPlans);

// Admin only
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    createPlan
);

router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    updatePlan
);

module.exports = router;