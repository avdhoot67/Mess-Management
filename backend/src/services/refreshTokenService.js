const crypto = require('crypto');
const pool = require('../config/db');

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14);
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createToken = () => crypto.randomBytes(32).toString('base64url');

const createRefreshToken = async ({ userId, sessionVersion, connection = pool }) => {
    const token = createToken();
    await connection.query(
        `INSERT INTO refresh_tokens (token_hash, user_id, session_version, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
        [hashToken(token), userId, sessionVersion, REFRESH_TOKEN_TTL_DAYS]
    );
    return token;
};

const rotateRefreshToken = async (token) => {
    if (!token || typeof token !== 'string' || token.length > 100) {
        throw new Error('INVALID_REFRESH_TOKEN');
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [tokens] = await connection.query(
            `SELECT rt.token_hash, rt.user_id, rt.session_version, u.session_version AS user_session_version
             FROM refresh_tokens rt
             JOIN users u ON u.user_id = rt.user_id
             WHERE rt.token_hash = ?
               AND rt.revoked_at IS NULL
               AND rt.expires_at > NOW()
             FOR UPDATE`,
            [hashToken(token)]
        );

        if (tokens.length !== 1 || Number(tokens[0].session_version) !== Number(tokens[0].user_session_version)) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }

        const refreshToken = tokens[0];
        await connection.query(
            'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
            [refreshToken.token_hash]
        );
        const nextToken = await createRefreshToken({
            userId: refreshToken.user_id,
            sessionVersion: refreshToken.user_session_version,
            connection
        });
        await connection.commit();
        return { userId: refreshToken.user_id, refreshToken: nextToken };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const revokeRefreshToken = async (token) => {
    if (!token || typeof token !== 'string' || token.length > 100) return;
    await pool.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
        [hashToken(token)]
    );
};

module.exports = { createRefreshToken, revokeRefreshToken, rotateRefreshToken };
