const required = (name) => {
    const value = String(process.env[name] || '').trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
};

const requireHttpsUrl = (name) => {
    const value = required(name);
    let url;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`${name} must be a valid URL`);
    }

    if (url.protocol !== 'https:') throw new Error(`${name} must use HTTPS in production`);
    return value;
};

const validateServerEnvironment = () => {
    required('JWT_SECRET');

    if (process.env.NODE_ENV !== 'production') return;

    if (required('JWT_SECRET').length < 32) {
        throw new Error('JWT_SECRET must contain at least 32 characters in production');
    }

    requireHttpsUrl('FRONTEND_URL');

    if (process.env.AUTH_COOKIE_SECURE !== 'true') {
        throw new Error('AUTH_COOKIE_SECURE must be true in production');
    }

    if (!process.env.TRUST_PROXY || process.env.TRUST_PROXY === 'false') {
        throw new Error('TRUST_PROXY must be enabled in production');
    }

    if (process.env.DB_SSL !== 'true') {
        throw new Error('DB_SSL must be true in production');
    }

    const sameSite = String(process.env.AUTH_COOKIE_SAME_SITE || '').toLowerCase();
    if (!['lax', 'strict', 'none'].includes(sameSite)) {
        throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none in production');
    }

    const provider = String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
    if (!['brevo', 'smtp'].includes(provider)) {
        throw new Error('EMAIL_PROVIDER must be brevo or smtp in production');
    }

    const emailVariables = provider === 'brevo'
        ? ['BREVO_API_KEY', 'EMAIL_FROM_NAME', 'EMAIL_FROM_ADDRESS']
        : ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
    emailVariables.forEach(required);
};

module.exports = { validateServerEnvironment };
