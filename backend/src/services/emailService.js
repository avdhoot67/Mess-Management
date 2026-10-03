const nodemailer = require('nodemailer');

const isEmailConfigured = () => Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
);

const createTransporter = () => {
    if (!isEmailConfigured()) {
        throw new Error('SMTP email delivery is not configured');
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
    const transporter = createTransporter();
    const safeName = escapeHtml(name || 'there');
    const safeResetUrl = escapeHtml(resetUrl);

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Reset your MessMate password',
        text: `Hello ${name || 'there'},\n\nUse this link to reset your MessMate password:\n${resetUrl}\n\nThis link expires in 30 minutes and can be used once. If you did not request it, you can ignore this email.`,
        html: `
            <div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
                <div style="margin:0 auto;max-width:560px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;padding:32px">
                    <p style="margin:0 0 24px;font-size:20px;font-weight:700">Mess<span style="color:#059669">Mate</span></p>
                    <h1 style="margin:0;font-size:24px;line-height:1.25">Reset your password</h1>
                    <p style="margin:16px 0 0;line-height:1.6;color:#475569">Hello ${safeName}, use the button below to choose a new password for your account.</p>
                    <a href="${safeResetUrl}" style="display:inline-block;margin-top:24px;border-radius:8px;background:#059669;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:700">Reset password</a>
                    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b">This link expires in 30 minutes and can be used once. If you did not request this change, no action is required.</p>
                </div>
            </div>
        `
    });
};

const sendAdminInvitationEmail = async ({ email, inviterName, invitationUrl }) => {
    const transporter = createTransporter();
    const safeInviterName = escapeHtml(inviterName || 'A MessMate administrator');
    const safeInvitationUrl = escapeHtml(invitationUrl);

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'You are invited to administer MessMate',
        text: `${inviterName || 'A MessMate administrator'} invited you to join the MessMate admin team.\n\nCreate your administrator account here:\n${invitationUrl}\n\nThis invitation expires in 48 hours and can be used once. If you were not expecting it, you can ignore this email.`,
        html: `
            <div style="margin:0;background:#f1f5f9;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
                <div style="margin:0 auto;max-width:560px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;padding:32px">
                    <p style="margin:0 0 24px;font-size:20px;font-weight:700">Mess<span style="color:#059669">Mate</span></p>
                    <h1 style="margin:0;font-size:24px;line-height:1.25">Join the admin team</h1>
                    <p style="margin:16px 0 0;line-height:1.6;color:#475569">${safeInviterName} invited you to help manage meals, subscriptions, bookings, and payments in MessMate.</p>
                    <a href="${safeInvitationUrl}" style="display:inline-block;margin-top:24px;border-radius:8px;background:#059669;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:700">Create admin account</a>
                    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b">This invitation expires in 48 hours and can be used once. If you were not expecting it, no action is required.</p>
                </div>
            </div>
        `
    });
};

module.exports = {
    isEmailConfigured,
    sendAdminInvitationEmail,
    sendPasswordResetEmail
};
