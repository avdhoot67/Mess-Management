const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createAdminInvitation = async ({ email, invitedBy }) => {
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [users] = await connection.query(
            'SELECT user_id FROM users WHERE email = ? FOR UPDATE',
            [email]
        );

        if (users.length > 0) throw new Error('ACCOUNT_EXISTS');

        await connection.query(
            `INSERT INTO admin_invitations
                (email, token_hash, invited_by, expires_at, accepted_at, revoked_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 48 HOUR), NULL, NULL)
             ON DUPLICATE KEY UPDATE
                token_hash = VALUES(token_hash),
                invited_by = VALUES(invited_by),
                expires_at = VALUES(expires_at),
                accepted_at = NULL,
                revoked_at = NULL,
                created_at = CURRENT_TIMESTAMP`,
            [email, tokenHash, invitedBy]
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

const getAdminAccess = async () => {
    const [administrators] = await pool.query(
        `SELECT user_id, name, email, phone, created_at
         FROM users
         WHERE role = 'admin'
         ORDER BY created_at ASC`
    );
    const [invitations] = await pool.query(
        `SELECT ai.invitation_id, ai.email, ai.expires_at, ai.created_at,
                u.name AS invited_by_name
         FROM admin_invitations ai
         JOIN users u ON u.user_id = ai.invited_by
         WHERE ai.accepted_at IS NULL
           AND ai.revoked_at IS NULL
           AND ai.expires_at > NOW()
         ORDER BY ai.created_at DESC`
    );

    return { administrators, invitations };
};

const getValidInvitation = async (token) => {
    if (!token || typeof token !== 'string' || token.length > 100) {
        throw new Error('INVALID_INVITATION');
    }

    const [invitations] = await pool.query(
        `SELECT invitation_id, email, expires_at
         FROM admin_invitations
         WHERE token_hash = ?
           AND accepted_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > NOW()`,
        [hashToken(token)]
    );

    if (invitations.length !== 1) throw new Error('INVALID_INVITATION');
    return invitations[0];
};

const revokeAdminInvitation = async (invitationId) => {
    const [result] = await pool.query(
        `UPDATE admin_invitations
         SET revoked_at = NOW()
         WHERE invitation_id = ?
           AND accepted_at IS NULL
           AND revoked_at IS NULL`,
        [invitationId]
    );

    if (result.affectedRows !== 1) throw new Error('INVITATION_UNAVAILABLE');
};

const acceptAdminInvitation = async ({ token, name, phone, password }) => {
    if (!token || typeof token !== 'string' || token.length > 100) {
        throw new Error('INVALID_INVITATION');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [invitations] = await connection.query(
            `SELECT invitation_id, email
             FROM admin_invitations
             WHERE token_hash = ?
               AND accepted_at IS NULL
               AND revoked_at IS NULL
               AND expires_at > NOW()
             FOR UPDATE`,
            [hashToken(token)]
        );

        if (invitations.length !== 1) throw new Error('INVALID_INVITATION');

        const invitation = invitations[0];
        const [users] = await connection.query(
            'SELECT user_id FROM users WHERE email = ? FOR UPDATE',
            [invitation.email]
        );

        if (users.length > 0) throw new Error('ACCOUNT_EXISTS');

        const [result] = await connection.query(
            `INSERT INTO users (name, email, password, phone, role)
             VALUES (?, ?, ?, ?, 'admin')`,
            [name, invitation.email, passwordHash, phone]
        );
        await connection.query(
            'UPDATE admin_invitations SET accepted_at = NOW() WHERE invitation_id = ?',
            [invitation.invitation_id]
        );
        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') throw new Error('ACCOUNT_EXISTS');
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    acceptAdminInvitation,
    createAdminInvitation,
    getAdminAccess,
    getValidInvitation,
    revokeAdminInvitation
};
