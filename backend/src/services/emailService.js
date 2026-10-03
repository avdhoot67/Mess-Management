const nodemailer = require('nodemailer');

const getProvider = () => String(process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

const isSmtpConfigured = () => Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
);

const isBrevoConfigured = () => Boolean(
    process.env.BREVO_API_KEY &&
    process.env.EMAIL_FROM_ADDRESS &&
    process.env.EMAIL_FROM_NAME
);

const isEmailConfigured = () => getProvider() === 'brevo'
    ? isBrevoConfigured()
    : getProvider() === 'smtp' && isSmtpConfigured();

const createTransporter = () => {
    if (!isSmtpConfigured()) {
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

const sendWithBrevo = async ({ to, subject, text, html }) => {
    if (!isBrevoConfigured()) throw new Error('Brevo email delivery is not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: process.env.EMAIL_FROM_NAME,
                    email: process.env.EMAIL_FROM_ADDRESS
                },
                to: [{ email: to }],
                subject,
                textContent: text,
                htmlContent: html
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => null);
            const errorDetail = [errorPayload?.code, errorPayload?.message]
                .filter(Boolean)
                .join(': ');

            throw new Error(
                `Brevo email delivery failed with status ${response.status}`
                + (errorDetail ? ` (${errorDetail})` : '')
            );
        }
    } finally {
        clearTimeout(timeout);
    }
};

const sendEmail = async (message) => {
    const provider = getProvider();

    if (provider === 'brevo') return sendWithBrevo(message);
    if (provider !== 'smtp') throw new Error(`Unsupported email provider: ${provider}`);

    const transporter = createTransporter();
    return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        ...message
    });
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
    const safeName = escapeHtml(name || 'there');
    const safeResetUrl = escapeHtml(resetUrl);

    await sendEmail({
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
    const safeInviterName = escapeHtml(inviterName || 'A MessMate administrator');
    const safeInvitationUrl = escapeHtml(invitationUrl);

    await sendEmail({
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
