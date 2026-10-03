const pool = require('../config/db');
const { normalizePaymentReference } = require('../utils/paymentReference');


// Create a booking and payment together
const createBooking = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.user_id;
        const { meal_id, transaction_reference } = req.body || {};

        if (!meal_id) {
            return res.status(400).json({
                success: false,
                message: 'Meal ID is required'
            });
        }

        const transactionReference = normalizePaymentReference(transaction_reference);
        if (!transactionReference) {
            return res.status(400).json({
                success: false,
                message: 'Enter a transaction reference using 6 to 100 letters, numbers, hyphens, or underscores'
            });
        }

        const mealId = Number(meal_id);

        if (!Number.isInteger(mealId) || mealId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meal ID'
            });
        }

        await connection.beginTransaction();

        // Check that the meal exists and has not passed.
        const [meals] = await connection.query(
            `
            SELECT
                meal_id,
                DATE_FORMAT(meal_date, '%Y-%m-%d') AS meal_date,
                meal_type,
                menu,
                price,
                (meal_date < CURRENT_DATE) AS meal_expired
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

        if (meal.meal_expired) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'This meal has already passed'
            });
        }

        // Check whether this user already has a booking.
        const [existingBookings] = await connection.query(
            `
            SELECT
                booking_id,
                status
            FROM bookings
            WHERE user_id = ?
              AND meal_id = ?
            FOR UPDATE
            `,
            [userId, mealId]
        );

        if (existingBookings.length > 0) {
            const existingBooking = existingBookings[0];

            // Already waiting for payment verification.
            if (existingBooking.status === 'pending') {
                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message: 'You already have a pending booking for this meal'
                });
            }

            // Already confirmed.
            if (existingBooking.status === 'confirmed') {
                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message: 'You have already booked this meal'
                });
            }

            // Previously cancelled → rebook.
            if (existingBooking.status === 'cancelled') {

                // Reactivate the existing booking as pending.
                await connection.query(
                    `
                    UPDATE bookings
                    SET
                        status = 'pending',
                        cancelled_at = NULL,
                        booked_at = CURRENT_TIMESTAMP
                    WHERE booking_id = ?
                    `,
                    [existingBooking.booking_id]
                );

                // Create a new pending payment.
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
                    VALUES (NULL, ?, ?, ?, 'pending')
                    `,
                    [
                        existingBooking.booking_id,
                        meal.price,
                        transactionReference
                    ]
                );

                await connection.commit();

                return res.status(201).json({
                    success: true,
                    message: 'Meal rebooking submitted for payment verification',
                    booking: {
                        booking_id: existingBooking.booking_id,
                        meal_id: meal.meal_id,
                        meal_date: meal.meal_date,
                        meal_type: meal.meal_type,
                        amount: meal.price,
                        booking_status: 'pending'
                    },
                    payment: {
                        payment_id: paymentResult.insertId,
                        amount: meal.price,
                        transaction_reference: transactionReference,
                        payment_status: 'pending'
                    }
                });
            }
        }

        // Create a new booking in pending state.
        const [bookingResult] = await connection.query(
            `
            INSERT INTO bookings
                (user_id, meal_id, status)
            VALUES (?, ?, 'pending')
            `,
            [userId, mealId]
        );

        const bookingId = bookingResult.insertId;

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
            VALUES (NULL, ?, ?, ?, 'pending')
            `,
            [
                bookingId,
                meal.price,
                transactionReference
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Meal booking submitted for payment verification',
            booking: {
                booking_id: bookingId,
                meal_id: meal.meal_id,
                meal_date: meal.meal_date,
                meal_type: meal.meal_type,
                amount: meal.price,
                booking_status: 'pending'
            },
            payment: {
                payment_id: paymentResult.insertId,
                amount: meal.price,
                transaction_reference: transactionReference,
                payment_status: 'pending'
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Create booking error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'You already have a booking for this meal'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create booking'
        });

    } finally {
        connection.release();
    }
};

// Get current user's bookings
const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [bookings] = await pool.query(
            `
            SELECT
                b.booking_id,
                b.meal_id,
                b.status AS booking_status,
                b.booked_at,
                b.cancelled_at,
                DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date,
                m.meal_type,
                m.menu,
                m.price,
                p.payment_id,
                p.payment_status
            FROM bookings b
            JOIN meals m
                ON b.meal_id = m.meal_id
            LEFT JOIN (
                SELECT booking_id, MAX(payment_id) AS payment_id
                FROM payments
                WHERE booking_id IS NOT NULL
                GROUP BY booking_id
            ) latest_payment
                ON latest_payment.booking_id = b.booking_id
            LEFT JOIN payments p
                ON p.payment_id = latest_payment.payment_id
            WHERE b.user_id = ?
            ORDER BY m.meal_date DESC,
                     FIELD(m.meal_type, 'breakfast', 'lunch', 'dinner')
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Get bookings error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
};


// Cancel a booking
const cancelBooking = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.user_id;
        const { id } = req.params;

        await connection.beginTransaction();

        // Find the booking belonging to the current user.
        // MySQL also calculates whether the booking is eligible
        // for a refund based on the meal date.
        const [bookings] = await connection.query(
            `
            SELECT
                b.booking_id,
                b.status,
                b.cancelled_at,
                DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date,
                (m.meal_date < CURRENT_DATE) AS meal_passed,
                (m.meal_date > CURRENT_DATE) AS refund_eligible
            FROM bookings b
            JOIN meals m
                ON b.meal_id = m.meal_id
            WHERE b.booking_id = ?
              AND b.user_id = ?
            FOR UPDATE
            `,
            [id, userId]
        );

        if (bookings.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];

        if (Boolean(booking.meal_passed)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Past meal bookings cannot be cancelled'
            });
        }

        // Prevent cancelling the same booking twice
        if (booking.status === 'cancelled') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // MySQL returns this as 0 or 1
        const refundEligible = Boolean(booking.refund_eligible);

        // Cancel the booking
        await connection.query(
            `
            UPDATE bookings
            SET
                status = 'cancelled',
                cancelled_at = CURRENT_TIMESTAMP
            WHERE booking_id = ?
            `,
            [id]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            booking: {
                booking_id: booking.booking_id,
                status: 'cancelled',
                refund_eligible: refundEligible
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Cancel booking error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking'
        });

    } finally {
        connection.release();
    }
};

// Get all bookings - Admin only
const getAllBookings = async (req, res) => {
    try {
        const [bookings] = await pool.query(
            `
            SELECT
                b.booking_id,
                b.user_id,
                u.name AS student_name,
                u.email AS student_email,
                b.meal_id,
                DATE_FORMAT(
                    m.meal_date,
                    '%Y-%m-%d'
                ) AS meal_date,
                m.meal_type,
                m.menu,
                m.price,
                b.status AS booking_status,
                DATE_FORMAT(
                    b.booked_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS booked_at,
                DATE_FORMAT(
                    b.cancelled_at,
                    '%Y-%m-%d %H:%i:%s'
                ) AS cancelled_at,
                p.payment_id,
                p.amount AS payment_amount,
                p.payment_status,
                p.transaction_reference,
                DATE_FORMAT(
                    p.payment_date,
                    '%Y-%m-%d %H:%i:%s'
                ) AS payment_date
            FROM bookings b
            JOIN users u
                ON b.user_id = u.user_id
            JOIN meals m
                ON b.meal_id = m.meal_id
            LEFT JOIN (
                SELECT booking_id, MAX(payment_id) AS payment_id
                FROM payments
                WHERE booking_id IS NOT NULL
                GROUP BY booking_id
            ) latest_payment
                ON latest_payment.booking_id = b.booking_id
            LEFT JOIN payments p
                ON p.payment_id = latest_payment.payment_id
            ORDER BY b.booking_id DESC
            `
        );

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Get all bookings error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings'
        });
    }
};


module.exports = {
    createBooking,
    getMyBookings,
    cancelBooking,
    getAllBookings
};
