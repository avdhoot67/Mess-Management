const pool = require('../config/db');


// Create a day skip
const createDaySkip = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.user_id;
        const { subscription_id, skip_date } = req.body || {};

        if (!subscription_id || !skip_date) {
            return res.status(400).json({
                success: false,
                message: 'Subscription ID and skip date are required'
            });
        }

        await connection.beginTransaction();

        // Lock the subscription so concurrent skip requests
        // cannot bypass the 5-skip limit.
        const [subscriptions] = await connection.query(
            `
            SELECT
                subscription_id,
                user_id,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                status
            FROM subscriptions
            WHERE subscription_id = ?
              AND user_id = ?
            FOR UPDATE
            `,
            [subscription_id, userId]
        );

        if (subscriptions.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        const subscription = subscriptions[0];

        // Only active subscriptions can be skipped.
        if (subscription.status !== 'active') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Only active subscriptions can have skipped days'
            });
        }

        // Skip date must not be in the past.
        if (skip_date < new Date().toISOString().split('T')[0]) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Skip date cannot be in the past'
            });
        }

        // Skip date must belong to the current subscription period.
        if (
            skip_date < subscription.start_date ||
            skip_date > subscription.end_date
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Skip date must be within the subscription period'
            });
        }

        // Maximum 5 skips per subscription.
        const [skipCountResult] = await connection.query(
            `
            SELECT COUNT(*) AS skip_count
            FROM day_skips
            WHERE subscription_id = ?
            `,
            [subscription_id]
        );

        const skipCount = Number(skipCountResult[0].skip_count);

        if (skipCount >= 5) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Maximum of 5 skipped days allowed per subscription'
            });
        }

        // The UNIQUE(subscription_id, skip_date) constraint also
        // protects against duplicate skips at database level.
        const [existingSkips] = await connection.query(
            `
            SELECT skip_id
            FROM day_skips
            WHERE subscription_id = ?
              AND skip_date = ?
            `,
            [subscription_id, skip_date]
        );

        if (existingSkips.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'This date has already been skipped'
            });
        }

        // Insert the skip.
        const [skipResult] = await connection.query(
            `
            INSERT INTO day_skips
                (subscription_id, skip_date)
            VALUES (?, ?)
            `,
            [subscription_id, skip_date]
        );

        // Extend the subscription by one day.
        await connection.query(
            `
            UPDATE subscriptions
            SET end_date = DATE_ADD(end_date, INTERVAL 1 DAY)
            WHERE subscription_id = ?
            `,
            [subscription_id]
        );

        await connection.commit();

        // Get the updated end date.
        const [updatedSubscription] = await connection.query(
            `
            SELECT
                subscription_id,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                status
            FROM subscriptions
            WHERE subscription_id = ?
            `,
            [subscription_id]
        );

        res.status(201).json({
            success: true,
            message: 'Day skipped successfully',
            skip: {
                skip_id: skipResult.insertId,
                subscription_id,
                skip_date
            },
            subscription: updatedSubscription[0]
        });

    } catch (error) {
        await connection.rollback();

        console.error('Create day skip error:', error);

        // Database-level duplicate protection.
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'This date has already been skipped'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create day skip'
        });

    } finally {
        connection.release();
    }
};


// Get current user's skips
const getMyDaySkips = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [skips] = await pool.query(
            `
            SELECT
                ds.skip_id,
                ds.subscription_id,
                DATE_FORMAT(ds.skip_date, '%Y-%m-%d') AS skip_date,
                DATE_FORMAT(ds.created_at, '%Y-%m-%d') AS created_at
            FROM day_skips ds
            JOIN subscriptions s
                ON ds.subscription_id = s.subscription_id
            WHERE s.user_id = ?
            ORDER BY ds.skip_date DESC
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: skips.length,
            skips
        });

    } catch (error) {
        console.error('Get day skips error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch day skips'
        });
    }
};


module.exports = {
    createDaySkip,
    getMyDaySkips
};