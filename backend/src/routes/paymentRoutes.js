const express = require('express');

const {
    getMyPayments,
    downloadMyPaymentReceipt,
    getAllPayments,
    approvePayment,
    rejectPayment
} = require('../controllers/paymentController');

const authorizeRoles = require('../middleware/roleMiddleware');

const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
    '/',
    authenticateToken,
    getMyPayments
);

router.get(
    '/:id/receipt',
    authenticateToken,
    downloadMyPaymentReceipt
);

router.get(
    '/admin',
    authenticateToken,
    authorizeRoles('admin'),
    getAllPayments
);

router.post(
    '/:id/approve',
    authenticateToken,
    authorizeRoles('admin'),
    approvePayment
);

router.post(
    '/:id/reject',
    authenticateToken,
    authorizeRoles('admin'),
    rejectPayment
);


module.exports = router;
