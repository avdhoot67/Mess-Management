require('dotenv').config();
const { validateServerEnvironment } = require('./config/environment');
validateServerEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const mealRoutes = require('./routes/mealRoutes');
const planRoutes = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const daySkipRoutes = require('./routes/daySkipRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const feedbackInsightsRoutes = require('./routes/feedbackInsightsRoutes');
const adminInvitationRoutes = require('./routes/adminInvitationRoutes');
const customerRoutes = require('./routes/customerRoutes');

const app = express();

const allowedOrigins = new Set(
    [process.env.FRONTEND_URL || 'http://localhost:5173', ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',')]
        .map((origin) => origin.trim())
        .filter(Boolean)
);

if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
} else if (/^\d+$/.test(process.env.TRUST_PROXY || '')) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400
}));
app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '32kb' }));
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.API_RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/skips', daySkipRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/feedback/admin/insights', feedbackInsightsRoutes);
app.use('/api/admin-invitations', adminInvitationRoutes);
app.use('/api/customers', customerRoutes);

const PORT = process.env.PORT || 5000;

app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS connected');

        res.status(200).json({
            success: true,
            message: 'Backend and database are connected',
            database: rows[0].connected === 1
        });
    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});

app.use((error, req, res, next) => {
    if (error?.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'Request body is too large' });
    }
    if (error?.message === 'CORS origin is not allowed') {
        return res.status(403).json({ success: false, message: 'Request origin is not allowed' });
    }
    console.error('Unhandled request error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
