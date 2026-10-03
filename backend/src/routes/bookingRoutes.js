const express = require('express');

const {
    createBooking,
    getMyBookings,
    cancelBooking,
    getAllBookings
} = require('../controllers/bookingController');

const authenticateToken = require('../middleware/authMiddleware');

const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post(
    '/',
    authenticateToken,
    createBooking
);

router.get(
    '/',
    authenticateToken,
    getMyBookings
);

router.patch(
    '/:id/cancel',
    authenticateToken,
    cancelBooking
);

router.get(
    '/admin',
    authenticateToken,
    authorizeRoles('admin'),
    getAllBookings
);

module.exports = router;