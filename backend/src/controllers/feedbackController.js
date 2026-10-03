const pool = require('../config/db');


// Submit feedback
const createFeedback = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.user_id;
        const { meal_id, rating, message } = req.body || {};

        if (!meal_id || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Meal ID and rating are required'
            });
        }

        // Validate rating
        if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be an integer between 1 and 5'
            });
        }

        const mealId = Number(meal_id);
        if (!Number.isSafeInteger(mealId) || mealId < 1) {
            return res.status(400).json({ success: false, message: 'Invalid meal ID' });
        }

        if (message !== undefined && (typeof message !== 'string' || message.trim().length > 1000)) {
            return res.status(400).json({
                success: false,
                message: 'Feedback message must be 1,000 characters or fewer'
            });
        }

        await connection.beginTransaction();

        // Get meal details
        const [meals] = await connection.query(
            `
            SELECT
                meal_id,
                DATE_FORMAT(meal_date, '%Y-%m-%d') AS meal_date,
                meal_type,
                (meal_date > CURRENT_DATE) AS meal_in_future
            FROM meals
            WHERE meal_id = ?
            FOR UPDATE
            `,
            [mealId]
        );

        if (meals.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        const meal = meals[0];

        // Feedback can only be submitted for today's or past meals.
        if (meal.meal_in_future) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Feedback can only be submitted for today or past meals'
            });
        }

        /*
         * Check whether the student has an active subscription
         * covering the meal date.
         */
        const [subscriptions] = await connection.query(
            `
            SELECT
                s.subscription_id
            FROM subscriptions s
            WHERE s.user_id = ?
              AND s.status = 'active'
              AND s.start_date <= ?
              AND s.end_date >= ?
            LIMIT 1
            `,
            [userId, meal.meal_date, meal.meal_date]
        );

        let eligible = false;

        if (subscriptions.length > 0) {
            const subscriptionId = subscriptions[0].subscription_id;

            // Check whether this subscription skipped the meal date
            const [skips] = await connection.query(
                `
                SELECT skip_id
                FROM day_skips
                WHERE subscription_id = ?
                  AND skip_date = ?
                LIMIT 1
                `,
                [subscriptionId, meal.meal_date]
            );

            if (skips.length === 0) {
                eligible = true;
            }
        }

        /*
         * If the student is not eligible through a subscription,
         * check whether they have a confirmed booking.
         */
        if (!eligible) {
            const [bookings] = await connection.query(
                `
                SELECT booking_id
                FROM bookings
                WHERE user_id = ?
                  AND meal_id = ?
                  AND status = 'confirmed'
                LIMIT 1
                `,
                [userId, mealId]
            );

            if (bookings.length > 0) {
                eligible = true;
            }
        }

        if (!eligible) {
            await connection.rollback();

            return res.status(403).json({
                success: false,
                message: 'You are not eligible to submit feedback for this meal'
            });
        }

        // Check for existing feedback
        const [existingFeedback] = await connection.query(
            `
            SELECT feedback_id
            FROM feedback
            WHERE user_id = ?
              AND meal_id = ?
            LIMIT 1
            `,
            [userId, mealId]
        );

        if (existingFeedback.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: 'You have already submitted feedback for this meal'
            });
        }

        // Create feedback
        const [result] = await connection.query(
            `
            INSERT INTO feedback
                (user_id, meal_id, rating, message)
            VALUES (?, ?, ?, ?)
            `,
            [userId, mealId, Number(rating), message?.trim() || null]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                feedback_id: result.insertId,
                meal_id: mealId,
                rating: Number(rating),
                message: message?.trim() || null
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Create feedback error:', error);

        // Database-level duplicate protection
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'You have already submitted feedback for this meal'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });

    } finally {
        connection.release();
    }
};


// Get current user's feedback
const getMyFeedback = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [feedback] = await pool.query(
            `
            SELECT
                f.feedback_id,
                f.meal_id,
                DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date,
                m.meal_type,
                m.menu,
                f.rating,
                f.message,
                DATE_FORMAT(f.created_at, '%Y-%m-%d') AS created_at
            FROM feedback f
            JOIN meals m
                ON f.meal_id = m.meal_id
            WHERE f.user_id = ?
            ORDER BY m.meal_date DESC,
                     FIELD(m.meal_type, 'breakfast', 'lunch', 'dinner')
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: feedback.length,
            feedback
        });

    } catch (error) {
        console.error('Get feedback error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback'
        });
    }
};

// Get all feedback - Admin only
const getAllFeedback = async (req, res) => {
    try {
        const [feedback] = await pool.query(
            `
            SELECT
                f.feedback_id,
                f.user_id,
                u.name AS student_name,
                u.email AS student_email,
                f.meal_id,
                DATE_FORMAT(
                    m.meal_date,
                    '%Y-%m-%d'
                ) AS meal_date,
                m.meal_type,
                m.menu,
                f.rating,
                f.message,
                DATE_FORMAT(
                    f.created_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS created_at
            FROM feedback f
            JOIN users u
                ON f.user_id = u.user_id
            JOIN meals m
                ON f.meal_id = m.meal_id
            ORDER BY f.feedback_id DESC
            `
        );

        res.status(200).json({
            success: true,
            count: feedback.length,
            feedback
        });

    } catch (error) {
        console.error('Get all feedback error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch feedback'
        });
    }
};

module.exports = {
    createFeedback,
    getMyFeedback,
    getAllFeedback
};
