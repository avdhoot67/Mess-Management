const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { createRefreshToken, revokeRefreshToken, rotateRefreshToken } = require('../services/refreshTokenService');
const {
    clearStateCookie,
    consumeLoginGrant,
    createLoginGrant,
    createAuthorizationUrl,
    exchangeCodeForProfile,
    getFrontendUrl,
    verifyState
} = require('../services/googleAuthService');

const publicUser = (user) => ({
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
});

const refreshCookieOptions = () => {
    const secure = process.env.AUTH_COOKIE_SECURE === 'true'
        || (process.env.AUTH_COOKIE_SECURE === undefined && process.env.NODE_ENV === 'production');
    const sameSite = process.env.AUTH_COOKIE_SAME_SITE || (secure ? 'none' : 'lax');

    return {
        httpOnly: true,
        secure,
        sameSite,
        path: '/api/auth',
        maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14) * 24 * 60 * 60 * 1000
    };
};

const clearRefreshCookie = (res) => {
    const { maxAge, ...options } = refreshCookieOptions();
    return res.clearCookie('messmate_refresh', options);
};

const createAccessSession = (user) => ({
    token: jwt.sign(
        { user_id: user.user_id, role: user.role, sv: Number(user.session_version || 0) },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
    ),
    user: publicUser(user)
});

const createSession = async (user) => ({
    ...createAccessSession(user),
    refreshToken: await createRefreshToken({
        userId: user.user_id,
        sessionVersion: Number(user.session_version || 0)
    })
});

const sendSession = async (res, user, message) => {
    const { refreshToken, ...session } = await createSession(user);
    res.cookie('messmate_refresh', refreshToken, refreshCookieOptions());
    return res.status(200).json({ success: true, message, ...session });
};

const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body || {};

        // Basic validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and no more than 72 bytes'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check whether email already exists
        const [existingUsers] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create student account
        const [result] = await pool.query(
            `INSERT INTO users
                (name, email, password, phone, role)
             VALUES (?, ?, ?, ?, 'student')`,
            [name, email, hashedPassword, phone]
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user_id: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const [users] = await pool.query(
            `SELECT user_id, name, email, password, phone, role, session_version
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const passwordMatch = user.password
            ? await bcrypt.compare(password, user.password)
            : false;

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        return sendSession(res, user, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const startGoogleLogin = (req, res) => {
    try {
        return res.redirect(createAuthorizationUrl(res));
    } catch (error) {
        console.error('Google login configuration error:', error.message);
        return res.redirect(`${getFrontendUrl()}/auth/google/callback?error=not_configured`);
    }
};

const startGoogleLink = (req, res) => {
    try {
        const authorizationUrl = createAuthorizationUrl(res, {
            mode: 'link',
            userId: req.user.user_id
        });

        return res.status(200).json({ success: true, authorization_url: authorizationUrl });
    } catch (error) {
        console.error('Google link configuration error:', error.message);
        return res.status(503).json({ success: false, message: 'Google linking is not available right now' });
    }
};

const googleCallback = async (req, res) => {
    const callbackUrl = `${getFrontendUrl()}/auth/google/callback`;
    let state;

    try {
        state = verifyState(req);
        clearStateCookie(res);

        if (req.query.error) {
            return res.redirect(`${callbackUrl}?error=cancelled&flow=${state.mode}`);
        }

        const profile = await exchangeCodeForProfile(req.query.code);

        if (state.mode === 'link') {
            const [conflicts] = await pool.query(
                `SELECT user_id FROM users
                 WHERE (google_sub = ? OR email = ?) AND user_id <> ?`,
                [profile.googleSub, profile.email, state.user_id]
            );

            if (conflicts.length > 0) {
                return res.redirect(`${callbackUrl}?error=google_account_in_use&flow=link`);
            }

            const [result] = await pool.query(
                'UPDATE users SET google_sub = ? WHERE user_id = ?',
                [profile.googleSub, state.user_id]
            );

            if (result.affectedRows === 0) {
                return res.redirect(`${callbackUrl}?error=account_not_found&flow=link`);
            }

            const grant = await createLoginGrant(state.user_id);
            return res.redirect(`${callbackUrl}?code=${encodeURIComponent(grant)}&linked=1&flow=link`);
        }

        const [linkedUsers] = await pool.query(
            'SELECT user_id FROM users WHERE google_sub = ?',
            [profile.googleSub]
        );

        if (linkedUsers.length > 0) {
            const grant = await createLoginGrant(linkedUsers[0].user_id);
            return res.redirect(`${callbackUrl}?code=${encodeURIComponent(grant)}`);
        }

        const [emailUsers] = await pool.query(
            'SELECT user_id FROM users WHERE email = ?',
            [profile.email]
        );

        if (emailUsers.length > 0) {
            return res.redirect(`${callbackUrl}?error=account_exists`);
        }

        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, google_sub, phone, role)
             VALUES (?, ?, NULL, ?, NULL, 'student')`,
            [profile.name, profile.email, profile.googleSub]
        );

        const grant = await createLoginGrant(result.insertId);
        return res.redirect(`${callbackUrl}?code=${encodeURIComponent(grant)}&new=1`);
    } catch (error) {
        clearStateCookie(res);
        console.error('Google callback error:', error.message);
        return res.redirect(`${callbackUrl}?error=verification_failed&flow=${state?.mode || 'signin'}`);
    }
};

const completeGoogleLogin = async (req, res) => {
    try {
        const userId = await consumeLoginGrant(req.body?.code);
        const [users] = await pool.query(
            `SELECT user_id, name, email, phone, role, session_version
             FROM users WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Account no longer exists' });
        }

        return sendSession(res, users[0], 'Google login successful');
    } catch (error) {
        console.error('Google login completion error:', error.message);
        return res.status(401).json({ success: false, message: 'Google login session is missing or expired' });
    }
};

const refreshSession = async (req, res) => {
    try {
        const rotated = await rotateRefreshToken(req.cookies?.messmate_refresh);
        const [users] = await pool.query(
            `SELECT user_id, name, email, phone, role, session_version
             FROM users WHERE user_id = ?`,
            [rotated.userId]
        );

        if (users.length !== 1) throw new Error('INVALID_REFRESH_TOKEN');

        res.cookie('messmate_refresh', rotated.refreshToken, refreshCookieOptions());
        return res.status(200).json({
            success: true,
            message: 'Session refreshed',
            ...createAccessSession(users[0])
        });
    } catch (error) {
        clearRefreshCookie(res);
        if (error.message !== 'INVALID_REFRESH_TOKEN') {
            console.error('Session refresh error:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to refresh your session right now' });
        }
        return res.status(401).json({ success: false, message: 'Session is missing or expired' });
    }
};

const logout = async (req, res) => {
    try {
        await revokeRefreshToken(req.cookies?.messmate_refresh);
    } catch (error) {
        console.error('Logout token cleanup error:', error.message);
    }

    clearRefreshCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const getAccount = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT user_id, name, email, phone, role,
                    google_sub IS NOT NULL AS google_linked,
                    password IS NULL AS phone_optional
             FROM users WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const user = users[0];
        return res.status(200).json({
            success: true,
            account: {
                ...publicUser(user),
                google_linked: Boolean(user.google_linked),
                phone_optional: Boolean(user.phone_optional)
            }
        });
    } catch (error) {
        console.error('Account lookup error:', error);
        return res.status(500).json({ success: false, message: 'Unable to load account' });
    }
};

const updatePhone = async (req, res) => {
    try {
        const rawPhone = String(req.body?.phone || '').trim();
        const phone = rawPhone ? rawPhone.replace(/[+\s()-]/g, '') : null;

        if (!phone) {
            const [users] = await pool.query(
                'SELECT password IS NULL AS phone_optional FROM users WHERE user_id = ?',
                [req.user.user_id]
            );

            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }

            if (!Boolean(users[0].phone_optional)) {
                return res.status(400).json({
                    success: false,
                    message: 'A phone number is required for password accounts'
                });
            }
        }

        if (phone && !/^\d{10,15}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Enter a valid phone number with 10 to 15 digits'
            });
        }

        await pool.query('UPDATE users SET phone = ? WHERE user_id = ?', [phone, req.user.user_id]);
        return res.status(200).json({
            success: true,
            message: phone ? 'Phone number saved' : 'Phone number removed',
            phone
        });
    } catch (error) {
        console.error('Phone update error:', error);
        return res.status(500).json({ success: false, message: 'Unable to update phone number' });
    }
};

module.exports = {
    register,
    login,
    startGoogleLogin,
    startGoogleLink,
    googleCallback,
    completeGoogleLogin,
    refreshSession,
    logout,
    getAccount,
    updatePhone
};
