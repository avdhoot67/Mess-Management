const { sendAdminInvitationEmail } = require('../services/emailService');
const {
    acceptAdminInvitation,
    createAdminInvitation,
    getAdminAccess,
    getValidInvitation,
    revokeAdminInvitation
} = require('../services/adminInvitationService');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const listAdminAccess = async (req, res) => {
    try {
        const access = await getAdminAccess();
        return res.status(200).json({ success: true, ...access });
    } catch (error) {
        console.error('Admin access lookup error:', error);
        return res.status(500).json({ success: false, message: 'Unable to load administrator access' });
    }
};

const inviteAdministrator = async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!emailRegex.test(email) || email.length > 100) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    let token;
    try {
        token = await createAdminInvitation({ email, invitedBy: req.user.user_id });
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const invitationUrl = `${frontendUrl}/admin-invitation?token=${encodeURIComponent(token)}`;
        await sendAdminInvitationEmail({
            email,
            invitationUrl
        });
        return res.status(201).json({
            success: true,
            message: `Invitation sent to ${email}`
        });
    } catch (error) {
        if (token) {
            try {
                const invitation = await getValidInvitation(token);
                await revokeAdminInvitation(invitation.invitation_id);
            } catch (cleanupError) {
                if (cleanupError.message !== 'INVALID_INVITATION') {
                    console.error('Admin invitation cleanup error:', cleanupError.message);
                }
            }
        }

        if (error.message === 'ACCOUNT_EXISTS') {
            return res.status(409).json({
                success: false,
                message: 'This email already belongs to a MessMate account and cannot be invited as an administrator'
            });
        }

        console.error('Admin invitation delivery error:', error.message);
        return res.status(502).json({
            success: false,
            message: 'The invitation could not be delivered. Check the email address and try again.'
        });
    }
};

const validateAdminInvitation = async (req, res) => {
    try {
        const invitation = await getValidInvitation(req.body?.token);
        return res.status(200).json({
            success: true,
            invitation: {
                email: invitation.email,
                expires_at: invitation.expires_at
            }
        });
    } catch (error) {
        if (error.message !== 'INVALID_INVITATION') {
            console.error('Admin invitation validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unable to validate the administrator invitation'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'This invitation is invalid, expired, revoked, or has already been used'
        });
    }
};

const acceptAdministratorInvitation = async (req, res) => {
    try {
        const token = req.body?.token;
        const name = String(req.body?.name || '').trim();
        const rawPhone = String(req.body?.phone || '').trim();
        const phone = rawPhone.replace(/[+\s()-]/g, '');
        const password = String(req.body?.password || '');

        if (!name || name.length > 100) {
            return res.status(400).json({ success: false, message: 'Enter your full name' });
        }
        if (!/^\d{10,15}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'Enter a valid phone number with 10 to 15 digits' });
        }
        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and no more than 72 bytes'
            });
        }

        await acceptAdminInvitation({ token, name, phone, password });
        return res.status(201).json({
            success: true,
            message: 'Administrator account created. You can now sign in.'
        });
    } catch (error) {
        if (error.message === 'INVALID_INVITATION') {
            return res.status(400).json({
                success: false,
                message: 'This invitation is invalid, expired, revoked, or has already been used'
            });
        }
        if (error.message === 'ACCOUNT_EXISTS') {
            return res.status(409).json({
                success: false,
                message: 'An account already exists for this invitation email'
            });
        }

        console.error('Admin invitation acceptance error:', error);
        return res.status(500).json({ success: false, message: 'Unable to create the administrator account' });
    }
};

const revokeAdministratorInvitation = async (req, res) => {
    const invitationId = Number(req.params.id);
    if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(invitationId) || invitationId < 1) {
        return res.status(400).json({ success: false, message: 'Invalid invitation identifier' });
    }

    try {
        await revokeAdminInvitation(invitationId);
        return res.status(200).json({ success: true, message: 'Invitation revoked' });
    } catch (error) {
        if (error.message === 'INVITATION_UNAVAILABLE') {
            return res.status(404).json({ success: false, message: 'Active invitation not found' });
        }
        console.error('Admin invitation revocation error:', error);
        return res.status(500).json({ success: false, message: 'Unable to revoke the invitation' });
    }
};

module.exports = {
    acceptAdministratorInvitation,
    inviteAdministrator,
    listAdminAccess,
    revokeAdministratorInvitation,
    validateAdminInvitation
};
