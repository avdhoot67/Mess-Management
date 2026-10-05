const express = require('express');
const { getCustomers, getCustomerById } = require('../controllers/customerController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin'));
router.get('/', getCustomers);
router.get('/:id', getCustomerById);

module.exports = router;

