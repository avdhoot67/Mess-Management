const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authorization header'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const [users] = await pool.query(
            'SELECT session_version FROM users WHERE user_id = ?',
            [decoded.user_id]
        );

        if (users.length !== 1 || Number(decoded.sv) !== Number(users[0].session_version)) {
            return res.status(401).json({
                success: false,
                message: 'Your session has expired. Please sign in again.'
            });
        }

        req.user = decoded;

        next();

    } catch (error) {
        console.error('Authentication error:', error.message);

        if (!['JsonWebTokenError', 'NotBeforeError', 'TokenExpiredError'].includes(error.name)) {
            return res.status(500).json({
                success: false,
                message: 'Unable to validate your session right now'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authenticateToken;
