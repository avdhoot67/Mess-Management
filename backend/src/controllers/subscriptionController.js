
const pool = require('../config/db');
const { normalizePaymentReference } = require('../utils/paymentReference');


// Create subscription + payment together
const createSubscription = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.user_id;
        const { plan_id, transaction_reference } = req.body || {};

        // Validate plan ID
        if (
            plan_id === undefined ||
            !Number.isInteger(Number(plan_id)) ||
            Number(plan_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID'
            });
        }

        // Validate transaction reference
        const transactionReference = normalizePaymentReference(transaction_reference);
        if (!transactionReference) {
            return res.status(400).json({
                success: false,
                message: 'Enter a transaction reference using 6 to 100 letters, numbers, hyphens, or underscores'
            });
        }

        const planId = Number(plan_id);

        await connection.beginTransaction();

        // Check whether the student already has an active subscription.
        const [existingSubscriptions] = await connection.query(
            `
            SELECT subscription_id
            FROM subscriptions
            WHERE user_id = ?
              AND status = 'active'
              AND start_date <= CURRENT_DATE
              AND end_date >= CURRENT_DATE
            FOR UPDATE
            `,
            [userId]
        );

        if (existingSubscriptions.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'You already have an active subscription'
            });
        }

        // Get plan details.
        const [plans] = await connection.query(
            `
            SELECT
                plan_id,
                plan_name,
                duration_days,
                price
            FROM mess_plans
            WHERE plan_id = ?
            `,
            [planId]
        );

        if (plans.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Mess plan not found'
            });
        }

        const plan = plans[0];

        // Calculate subscription dates.
        const startDate = new Date();

        const endDate = new Date(startDate);
        endDate.setDate(
            endDate.getDate() + plan.duration_days - 1
        );

        // Format dates as YYYY-MM-DD.
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        };

        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        /*
         * Create the subscription as pending
         *
         * We don't want an unapproved subscription to be active.
         * The subscription row is therefore created with status='pending'
         *Admin approval will change it to 'active'.
         */
        const [subscriptionResult] = await connection.query(
            `
            INSERT INTO subscriptions
                (user_id, plan_id, start_date, end_date, status)
            VALUES (?, ?, ?, ?, 'pending')
            `,
            [
                userId,
                planId,
                formattedStartDate,
                formattedEndDate
            ]
        );

        const subscriptionId = subscriptionResult.insertId;

        // Create pending payment.
        const [paymentResult] = await connection.query(
            `
            INSERT INTO payments
                (
                    subscription_id,
                    booking_id,
                    amount,
                    transaction_reference,
                    payment_status
                )
            VALUES (?, NULL, ?, ?, 'pending')
            `,
            [
                subscriptionId,
                plan.price,
                transactionReference
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Subscription payment submitted for verification',
            subscription: {
                subscription_id: subscriptionId,
                plan_id: plan.plan_id,
                plan_name: plan.plan_name,
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                status: 'pending'
            },
            payment: {
                payment_id: paymentResult.insertId,
                amount: plan.price,
                transaction_reference: transactionReference,
                payment_status: 'pending'
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Create subscription error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to submit subscription payment'
        });

    } finally {
        connection.release();
    }
};


// Get current user's subscriptions
const getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [subscriptions] = await pool.query(
            `
            SELECT
                s.subscription_id,
                s.plan_id,
                mp.plan_name,
                mp.price,
                mp.duration_days,
                DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
                s.status,
                DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM subscriptions s
            JOIN mess_plans mp
                ON s.plan_id = mp.plan_id
            WHERE s.user_id = ?
            ORDER BY s.subscription_id DESC
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            subscriptions
        });

    } catch (error) {
        console.error('Get subscriptions error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriptions'
        });
    }
};

// Get all subscriptions - Admin only
const getAllSubscriptions = async (req, res) => {
    try {
        const [subscriptions] = await pool.query(
            `
            SELECT
                s.subscription_id,
                s.user_id,
                u.name AS student_name,
                u.email AS student_email,
                s.plan_id,
                mp.plan_name,
                mp.price,
                mp.duration_days,
                DATE_FORMAT(
                    s.start_date,
                    '%Y-%m-%d'
                ) AS start_date,
                DATE_FORMAT(
                    s.end_date,
                    '%Y-%m-%d'
                ) AS end_date,
                s.status,
                DATE_FORMAT(
                    s.created_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS created_at
            FROM subscriptions s
            JOIN users u
                ON s.user_id = u.user_id
            JOIN mess_plans mp
                ON s.plan_id = mp.plan_id
            ORDER BY s.subscription_id DESC
            `
        );

        res.status(200).json({
            success: true,
            count: subscriptions.length,
            subscriptions
        });

    } catch (error) {
        console.error('Get all subscriptions error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriptions'
        });
    }
};


module.exports = {
    createSubscription,
    getMySubscriptions,
    getAllSubscriptions
};

