const express = require('express');

const {
    createDaySkip,
    getMyDaySkips
} = require('../controllers/daySkipController');

const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/',
    authenticateToken,
    createDaySkip
);

router.get(
    '/',
    authenticateToken,
    getMyDaySkips
);

module.exports = router;