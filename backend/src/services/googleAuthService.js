const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');

const STATE_COOKIE = 'messmate_google_state';

const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const getGoogleClient = () => {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
        throw new Error('Google authentication is not configured');
    }

    return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
};

const cookieOptions = (maxAge) => ({
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/api/auth/google'
});

const createAuthorizationUrl = (res, { mode = 'signin', userId = null } = {}) => {
    const state = jwt.sign(
        {
            type: 'google-oauth-state',
            nonce: crypto.randomBytes(24).toString('hex'),
            mode,
            user_id: userId
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
    );

    res.cookie(STATE_COOKIE, state, cookieOptions(10 * 60 * 1000));

    return getGoogleClient().generateAuthUrl({
        access_type: 'online',
        scope: ['openid', 'email', 'profile'],
        prompt: 'select_account',
        state
    });
};

const verifyState = (req) => {
    const queryState = req.query.state;
    const cookieState = req.cookies?.[STATE_COOKIE];

    if (!queryState || !cookieState || queryState !== cookieState) {
        throw new Error('Invalid Google authentication state');
    }

    const state = jwt.verify(queryState, process.env.JWT_SECRET);

    if (state.type !== 'google-oauth-state' || !['signin', 'link'].includes(state.mode)) {
        throw new Error('Invalid Google authentication state');
    }

    return state;
};

const exchangeCodeForProfile = async (code) => {
    if (!code) throw new Error('Google authorization code is missing');

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) throw new Error('Google did not return an identity token');

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new Error('Google account email could not be verified');
    }

    return {
        googleSub: payload.sub,
        email: payload.email.trim().toLowerCase(),
        name: (payload.name || payload.email.split('@')[0]).trim().slice(0, 100)
    };
};

const hashGrant = (grant) => crypto.createHash('sha256').update(grant).digest('hex');

const createLoginGrant = async (userId) => {
    const grant = crypto.randomBytes(32).toString('base64url');

    await pool.query('DELETE FROM auth_exchange_grants WHERE expires_at <= NOW() OR used_at IS NOT NULL');
    await pool.query(
        `INSERT INTO auth_exchange_grants (grant_hash, user_id, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
        [hashGrant(grant), userId]
    );

    return grant;
};

const consumeLoginGrant = async (grant) => {
    if (!grant || typeof grant !== 'string' || grant.length > 100) {
        throw new Error('Google login grant is missing or invalid');
    }

    const grantHash = hashGrant(grant);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [grants] = await connection.query(
            `SELECT user_id FROM auth_exchange_grants
             WHERE grant_hash = ? AND used_at IS NULL AND expires_at > NOW()
             FOR UPDATE`,
            [grantHash]
        );

        if (grants.length !== 1) {
            throw new Error('Google login grant is missing, expired, or already used');
        }

        await connection.query(
            'UPDATE auth_exchange_grants SET used_at = NOW() WHERE grant_hash = ?',
            [grantHash]
        );
        await connection.commit();
        return grants[0].user_id;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const clearStateCookie = (res) => res.clearCookie(STATE_COOKIE, cookieOptions(0));

module.exports = {
    clearStateCookie,
    consumeLoginGrant,
    createLoginGrant,
    createAuthorizationUrl,
    exchangeCodeForProfile,
    getFrontendUrl,
    verifyState
};
