const pool = require('../config/db');

const parsePaymentId = (value) => {
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const escapePdfText = (value) => String(value ?? '')
    .replace(/[\\()]/g, '\\$&')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '');

const createReceiptPdf = (receipt) => {
    const details = receipt.payment_type === 'subscription'
        ? `Plan: ${receipt.plan_name || 'Mess subscription'}`
        : `Meal: ${receipt.meal_type || 'Meal'} - ${receipt.menu || 'Scheduled meal'} on ${receipt.meal_date || 'N/A'}`;
    const lines = [
        ['MESSMATE', 22, 740],
        ['PAYMENT RECEIPT', 14, 710],
        [`Receipt number: MM-${receipt.payment_id}`, 10, 680],
        [`Payment status: ${receipt.payment_status.toUpperCase()}`, 10, 663],
        [`Student: ${receipt.student_name}`, 10, 630],
        [`Email: ${receipt.student_email}`, 10, 613],
        [`Payment type: ${receipt.payment_type}`, 10, 580],
        [details, 10, 563],
        [`Amount: INR ${receipt.amount}`, 12, 530],
        [`Transaction reference: ${receipt.transaction_reference || 'Not provided'}`, 10, 513],
        [`Submitted on: ${receipt.payment_date}`, 10, 496],
        ['This receipt records the payment submission and its current verification status.', 9, 455],
        ['Thank you for using MessMate.', 9, 70]
    ];
    const content = ['BT', '/F1 12 Tf', '0.06 0.39 0.28 rg'];

    lines.forEach(([text, size, y]) => {
        content.push(`/F1 ${size} Tf`, `50 ${y} Td (${escapePdfText(text)}) Tj`, `-50 -${y} Td`);
    });

    content.push('ET');
    const stream = content.join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'latin1'));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, 'latin1');
};


const getMyPayments = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [payments] = await pool.query(
            `
            SELECT
                p.payment_id,
                p.subscription_id,
                p.booking_id,
                p.amount,
                p.transaction_reference,
                p.payment_status,
                DATE_FORMAT(
                    p.payment_date,
                    '%Y-%m-%d %H:%i:%s'
                ) AS payment_date,
                CASE
                    WHEN p.subscription_id IS NOT NULL THEN 'subscription'
                    ELSE 'booking'
                END AS payment_type
            FROM payments p
            LEFT JOIN subscriptions s
                ON p.subscription_id = s.subscription_id
            LEFT JOIN bookings b
                ON p.booking_id = b.booking_id
            WHERE COALESCE(s.user_id, b.user_id) = ?
            ORDER BY p.payment_date DESC
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });
    } catch (error) {
        console.error('Get my payments error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch payments'
        });
    }
};

const downloadMyPaymentReceipt = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const paymentId = parsePaymentId(req.params.id);
        if (!paymentId) {
            return res.status(400).json({ success: false, message: 'Invalid payment identifier' });
        }

        const [payments] = await pool.query(
            `
            SELECT
                p.payment_id,
                p.amount,
                p.transaction_reference,
                p.payment_status,
                DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date,
                CASE
                    WHEN p.subscription_id IS NOT NULL THEN 'subscription'
                    ELSE 'booking'
                END AS payment_type,
                u.name AS student_name,
                u.email AS student_email,
                mp.plan_name,
                m.meal_type,
                m.menu,
                DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date
            FROM payments p
            LEFT JOIN subscriptions s
                ON p.subscription_id = s.subscription_id
            LEFT JOIN bookings b
                ON p.booking_id = b.booking_id
            LEFT JOIN mess_plans mp
                ON s.plan_id = mp.plan_id
            LEFT JOIN meals m
                ON b.meal_id = m.meal_id
            JOIN users u
                ON u.user_id = COALESCE(s.user_id, b.user_id)
            WHERE p.payment_id = ?
              AND u.user_id = ?
            `,
            [paymentId, userId]
        );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Payment receipt not found'
            });
        }

        const pdf = createReceiptPdf(payments[0]);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="MessMate-receipt-${payments[0].payment_id}.pdf"`,
            'Content-Length': pdf.length
        });

        res.status(200).send(pdf);
    } catch (error) {
        console.error('Download payment receipt error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to generate payment receipt'
        });
    }
};


// Get all payments - Admin only
const getAllPayments = async (req, res) => {
    try {
        const [payments] = await pool.query(
            `
            SELECT
                p.payment_id,
                p.subscription_id,
                p.booking_id,
                p.amount,
                p.transaction_reference,
                p.payment_status,
                EXISTS(
                    SELECT 1
                    FROM payments p2
                    WHERE p2.transaction_reference = p.transaction_reference
                      AND p2.payment_id <> p.payment_id
                ) AS has_duplicate_reference,
                DATE_FORMAT(
                    p.payment_date,
                    '%Y-%m-%d %H:%i:%s'
                ) AS payment_date,
                CASE
                    WHEN p.subscription_id IS NOT NULL THEN 'subscription'
                    ELSE 'booking'
                END AS payment_type,

                u.user_id,
                u.name AS student_name,
                u.email AS student_email

            FROM payments p

            LEFT JOIN subscriptions s
                ON p.subscription_id = s.subscription_id

            LEFT JOIN bookings b
                ON p.booking_id = b.booking_id

            JOIN users u
                ON u.user_id = COALESCE(
                    s.user_id,
                    b.user_id
                )

            ORDER BY p.payment_date DESC
            `
        );

        res.status(200).json({
            success: true,
            count: payments.length,
            payments
        });

    } catch (error) {
        console.error('Get all payments error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch payments'
        });
    }
};

// Approve a pending payment - Admin only
const approvePayment = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const paymentId = parsePaymentId(req.params.id);
        if (!paymentId) {
            return res.status(400).json({ success: false, message: 'Invalid payment identifier' });
        }

        await connection.beginTransaction();

        // Lock the payment so two admins cannot process it simultaneously.
        const [payments] = await connection.query(
            `
            SELECT
                payment_id,
                subscription_id,
                booking_id,
                amount,
                transaction_reference,
                payment_status
            FROM payments
            WHERE payment_id = ?
            FOR UPDATE
            `,
            [paymentId]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const payment = payments[0];

        // Only pending payments can be approved.
        if (payment.payment_status !== 'pending') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: `Payment is already ${payment.payment_status}`
            });
        }

        const [duplicateReferences] = await connection.query(
            `SELECT payment_id
             FROM payments
             WHERE transaction_reference = ?
               AND payment_status = 'completed'
               AND payment_id <> ?
             LIMIT 1
             FOR UPDATE`,
            [payment.transaction_reference, payment.payment_id]
        );

        if (duplicateReferences.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'This transaction reference has already been approved for another payment'
            });
        }

        // Update payment status.
        await connection.query(
            `
            UPDATE payments
            SET payment_status = 'completed'
            WHERE payment_id = ?
            `,
            [paymentId]
        );

        // If this payment belongs to a subscription,
        // activate the subscription.
        if (payment.subscription_id !== null) {
            await connection.query(
                `
                UPDATE subscriptions
                SET status = 'active'
                WHERE subscription_id = ?
                    AND status = 'pending'
                `,
                [payment.subscription_id]
            );
        }

        // If this payment belongs to a booking,
        // confirm the booking after payment approval.
        if (payment.booking_id !== null) {
            await connection.query(
                `
                UPDATE bookings
                SET status = 'confirmed'
                WHERE booking_id = ?
                AND status = 'pending'
                `,
                [payment.booking_id]
            );
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Payment approved successfully',
            payment: {
                payment_id: payment.payment_id,
                subscription_id: payment.subscription_id,
                booking_id: payment.booking_id,
                amount: payment.amount,
                transaction_reference: payment.transaction_reference,
                payment_status: 'completed'
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Approve payment error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to approve payment'
        });

    } finally {
        connection.release();
    }
};


// Reject a pending payment - Admin only
const rejectPayment = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const paymentId = parsePaymentId(req.params.id);
        if (!paymentId) {
            return res.status(400).json({ success: false, message: 'Invalid payment identifier' });
        }

        await connection.beginTransaction();

        // Lock the payment.
        const [payments] = await connection.query(
            `
            SELECT
                payment_id,
                subscription_id,
                booking_id,
                amount,
                transaction_reference,
                payment_status
            FROM payments
            WHERE payment_id = ?
            FOR UPDATE
            `,
            [paymentId]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        const payment = payments[0];

        // Only pending payments can be rejected.
        if (payment.payment_status !== 'pending') {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: `Payment is already ${payment.payment_status}`
            });
        }

        // Mark payment as failed.
        await connection.query(
            `
            UPDATE payments
            SET payment_status = 'failed'
            WHERE payment_id = ?
            `,
            [paymentId]
        );

        // If a subscription record already exists for this payment,
        // make sure it does not remain active.
        if (payment.subscription_id !== null) {
            await connection.query(
                `
                UPDATE subscriptions
                SET status = 'cancelled'
                WHERE subscription_id = ?
                  AND status = 'pending'
                `,
                [payment.subscription_id]
            );
        }

        if (payment.booking_id !== null) {
            await connection.query(
                `
                UPDATE bookings
                SET
                    status = 'cancelled',
                    cancelled_at = CURRENT_TIMESTAMP
                WHERE booking_id = ?
                AND status = 'pending'
                `,
                [payment.booking_id]
            );
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Payment rejected successfully',
            payment: {
                payment_id: payment.payment_id,
                subscription_id: payment.subscription_id,
                booking_id: payment.booking_id,
                amount: payment.amount,
                transaction_reference: payment.transaction_reference,
                payment_status: 'failed'
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error('Reject payment error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to reject payment'
        });

    } finally {
        connection.release();
    }
};

module.exports = {
    getMyPayments,
    downloadMyPaymentReceipt,
    getAllPayments,
    approvePayment,
    rejectPayment
};
