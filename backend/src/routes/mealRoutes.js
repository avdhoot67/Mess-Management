const express = require('express');

const {
    createMeal,
    getMeals,
    getMealById,
    updateMeal,
    deleteMeal
} = require('../controllers/mealController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Anyone logged in can view meals
router.get('/', authenticateToken, getMeals);

router.get('/:id', authenticateToken, getMealById);

// Admin only
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    createMeal
);

router.put(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    updateMeal
);

router.delete(
    '/:id',
    authenticateToken,
    authorizeRoles('admin'),
    deleteMeal
);

module.exports = router;