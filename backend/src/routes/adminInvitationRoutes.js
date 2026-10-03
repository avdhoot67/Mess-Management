const express = require('express');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
    acceptAdministratorInvitation,
    inviteAdministrator,
    listAdminAccess,
    revokeAdministratorInvitation,
    validateAdminInvitation
} = require('../controllers/adminInvitationController');

const router = express.Router();
const invitationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many invitation requests. Please try again later.' }
});
const acceptanceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many invitation attempts. Please try again later.' }
});

router.post('/validate', acceptanceLimiter, validateAdminInvitation);
router.post('/accept', acceptanceLimiter, acceptAdministratorInvitation);
router.get('/', authenticateToken, authorizeRoles('admin'), listAdminAccess);
router.post('/', authenticateToken, authorizeRoles('admin'), invitationLimiter, inviteAdministrator);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), invitationLimiter, revokeAdministratorInvitation);

module.exports = router;
