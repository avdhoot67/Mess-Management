const pool = require('../config/db');
const { sendPasswordResetEmail } = require('../services/emailService');
const {
    createPasswordResetToken,
    invalidatePasswordResetToken,
    resetPasswordWithToken
} = require('../services/passwordResetService');

const GENERIC_RESPONSE = 'If that email belongs to a password account, a reset link will arrive shortly.';

const deliverResetEmail = async (email) => {
    let token;

    try {
        const [users] = await pool.query(
            `SELECT user_id, name FROM users
             WHERE email = ? AND password IS NOT NULL`,
            [email]
        );

        if (users.length !== 1) return;

        token = await createPasswordResetToken(users[0].user_id);
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

        await sendPasswordResetEmail({
            email,
            name: users[0].name,
            resetUrl
        });
    } catch (error) {
        if (token) {
            try {
                await invalidatePasswordResetToken(token);
            } catch (cleanupError) {
                console.error('Password reset token cleanup error:', cleanupError.message);
            }
        }
        console.error('Password reset email delivery error:', error.message);
    }
};

const requestPasswordReset = async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    res.status(200).json({ success: true, message: GENERIC_RESPONSE });
    void deliverResetEmail(email);
};

const resetPassword = async (req, res) => {
    try {
        const token = req.body?.token;
        const password = String(req.body?.password || '');

        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and no more than 72 bytes'
            });
        }

        await resetPasswordWithToken(token, password);
        return res.status(200).json({
            success: true,
            message: 'Password updated successfully. You can now sign in.'
        });
    } catch (error) {
        if (error.message === 'INVALID_RESET_TOKEN') {
            return res.status(400).json({
                success: false,
                message: 'This reset link is invalid, expired, or has already been used'
            });
        }

        console.error('Password reset error:', error);
        return res.status(500).json({ success: false, message: 'Unable to reset password right now' });
    }
};

module.exports = {
    requestPasswordReset,
    resetPassword
};
