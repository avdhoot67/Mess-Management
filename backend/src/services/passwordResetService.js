const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createPasswordResetToken = async (userId) => {
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query(
            `DELETE FROM password_reset_tokens
             WHERE expires_at <= NOW()
                OR (used_at IS NOT NULL AND used_at < DATE_SUB(NOW(), INTERVAL 1 DAY))`
        );
        await connection.query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
            [userId]
        );
        await connection.query(
            `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
            [tokenHash, userId]
        );
        await connection.commit();
        return token;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const invalidatePasswordResetToken = async (token) => {
    if (!token) return;
    await pool.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ? AND used_at IS NULL',
        [hashToken(token)]
    );
};

const resetPasswordWithToken = async (token, password) => {
    if (!token || typeof token !== 'string' || token.length > 100) {
        throw new Error('INVALID_RESET_TOKEN');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const tokenHash = hashToken(token);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [tokens] = await connection.query(
            `SELECT user_id FROM password_reset_tokens
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokens.length !== 1) throw new Error('INVALID_RESET_TOKEN');

        const userId = tokens[0].user_id;
        await connection.query(
            'UPDATE users SET password = ?, session_version = session_version + 1 WHERE user_id = ?',
            [passwordHash, userId]
        );
        await connection.query(
            'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
            [userId]
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createPasswordResetToken,
    invalidatePasswordResetToken,
    resetPasswordWithToken
};
