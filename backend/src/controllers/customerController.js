const pool = require('../config/db');

const SEGMENTS = new Set(['all', 'subscribed', 'bookings', 'both', 'inactive']);
const SORTS = {
    newest: 'u.created_at DESC, u.user_id DESC',
    oldest: 'u.created_at ASC, u.user_id ASC',
    name_asc: 'u.name ASC, u.user_id ASC',
    name_desc: 'u.name DESC, u.user_id DESC',
    recent_activity: 'last_activity_at DESC, u.user_id DESC'
};

const parsePositiveInteger = (value, fallback, maximum = Number.MAX_SAFE_INTEGER) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
    return Math.min(parsed, maximum);
};

const customerActivityJoins = `
    LEFT JOIN (
        SELECT
            s.user_id,
            COUNT(*) AS active_subscription_count,
            MAX(s.end_date) AS subscription_end_date,
            MAX(s.created_at) AS latest_subscription_activity
        FROM subscriptions s
        WHERE s.status = 'active'
          AND s.start_date <= CURRENT_DATE
          AND s.end_date >= CURRENT_DATE
        GROUP BY s.user_id
    ) active_subscriptions ON active_subscriptions.user_id = u.user_id
    LEFT JOIN (
        SELECT
            b.user_id,
            COUNT(*) AS upcoming_booking_count,
            MIN(m.meal_date) AS next_booking_date,
            MAX(b.booked_at) AS latest_booking_activity
        FROM bookings b
        JOIN meals m ON m.meal_id = b.meal_id
        WHERE b.status IN ('pending', 'confirmed')
          AND m.meal_date >= CURRENT_DATE
        GROUP BY b.user_id
    ) upcoming_bookings ON upcoming_bookings.user_id = u.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS feedback_count, AVG(rating) AS average_rating,
               MAX(created_at) AS latest_feedback_activity
        FROM feedback
        GROUP BY user_id
    ) feedback_summary ON feedback_summary.user_id = u.user_id
`;

const segmentCondition = (segment) => {
    const hasSubscription = 'COALESCE(active_subscriptions.active_subscription_count, 0) > 0';
    const hasBooking = 'COALESCE(upcoming_bookings.upcoming_booking_count, 0) > 0';

    if (segment === 'subscribed') return `${hasSubscription} AND NOT (${hasBooking})`;
    if (segment === 'bookings') return `${hasBooking} AND NOT (${hasSubscription})`;
    if (segment === 'both') return `${hasSubscription} AND ${hasBooking}`;
    if (segment === 'inactive') return `NOT (${hasSubscription}) AND NOT (${hasBooking})`;
    return '1 = 1';
};

const getCustomers = async (req, res) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
        const segment = SEGMENTS.has(req.query.segment) ? req.query.segment : 'all';
        const sort = Object.hasOwn(SORTS, req.query.sort) ? req.query.sort : 'newest';
        const page = parsePositiveInteger(req.query.page, 1, 100000);
        const limit = parsePositiveInteger(req.query.limit, 20, 50);
        const offset = (page - 1) * limit;
        const searchCondition = search
            ? "AND (u.name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone, '') LIKE ?)"
            : '';
        const searchParameters = search ? Array(3).fill(`%${search}%`) : [];
        const whereClause = `
            WHERE u.role = 'student'
              ${searchCondition}
              AND ${segmentCondition(segment)}
        `;

        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM users u
             ${customerActivityJoins}
             ${whereClause}`,
            searchParameters
        );

        const [customers] = await pool.query(
            `SELECT
                u.user_id,
                u.name,
                u.email,
                u.phone,
                DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS joined_at,
                COALESCE(active_subscriptions.active_subscription_count, 0) AS active_subscription_count,
                DATE_FORMAT(active_subscriptions.subscription_end_date, '%Y-%m-%d') AS subscription_end_date,
                COALESCE(upcoming_bookings.upcoming_booking_count, 0) AS upcoming_booking_count,
                DATE_FORMAT(upcoming_bookings.next_booking_date, '%Y-%m-%d') AS next_booking_date,
                COALESCE(feedback_summary.feedback_count, 0) AS feedback_count,
                ROUND(feedback_summary.average_rating, 1) AS average_rating,
                DATE_FORMAT(GREATEST(
                    u.created_at,
                    COALESCE(active_subscriptions.latest_subscription_activity, u.created_at),
                    COALESCE(upcoming_bookings.latest_booking_activity, u.created_at),
                    COALESCE(feedback_summary.latest_feedback_activity, u.created_at)
                ), '%Y-%m-%d %H:%i:%s') AS last_activity_at
             FROM users u
             ${customerActivityJoins}
             ${whereClause}
             ORDER BY ${SORTS[sort]}
             LIMIT ? OFFSET ?`,
            [...searchParameters, limit, offset]
        );

        const normalizedCustomers = customers.map((customer) => {
            const hasSubscription = Number(customer.active_subscription_count) > 0;
            const hasBooking = Number(customer.upcoming_booking_count) > 0;
            return {
                ...customer,
                active_subscription_count: Number(customer.active_subscription_count),
                upcoming_booking_count: Number(customer.upcoming_booking_count),
                feedback_count: Number(customer.feedback_count),
                average_rating: customer.average_rating === null ? null : Number(customer.average_rating),
                service_state: hasSubscription && hasBooking
                    ? 'both'
                    : hasSubscription
                        ? 'subscribed'
                        : hasBooking
                            ? 'bookings'
                            : 'inactive'
            };
        });
        const total = Number(countRows[0].total);

        return res.status(200).json({
            success: true,
            customers: normalizedCustomers,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.max(1, Math.ceil(total / limit))
            },
            filters: { search, segment, sort }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const customerId = Number(req.params.id);
        if (!Number.isSafeInteger(customerId) || customerId < 1) {
            return res.status(400).json({ success: false, message: 'Invalid customer identifier' });
        }

        const [customers] = await pool.query(
            `SELECT user_id, name, email, phone,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS joined_at
             FROM users
             WHERE user_id = ? AND role = 'student'`,
            [customerId]
        );
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const [subscriptions, bookings, payments, feedback] = await Promise.all([
            pool.query(
                `SELECT
                    s.subscription_id,
                    s.plan_id,
                    mp.plan_name,
                    mp.duration_days,
                    mp.price,
                    DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
                    DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
                    s.status,
                    (s.status = 'active' AND s.start_date <= CURRENT_DATE AND s.end_date >= CURRENT_DATE) AS is_current,
                    CASE
                        WHEN s.status = 'active' AND s.end_date >= CURRENT_DATE
                        THEN DATEDIFF(s.end_date, CURRENT_DATE) + 1
                        ELSE 0
                    END AS remaining_days,
                    COUNT(ds.skip_id) AS skipped_days,
                    GROUP_CONCAT(DATE_FORMAT(ds.skip_date, '%Y-%m-%d') ORDER BY ds.skip_date SEPARATOR ',') AS skip_dates,
                    DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
                 FROM subscriptions s
                 JOIN mess_plans mp ON mp.plan_id = s.plan_id
                 LEFT JOIN day_skips ds ON ds.subscription_id = s.subscription_id
                 WHERE s.user_id = ?
                 GROUP BY s.subscription_id, s.plan_id, mp.plan_name, mp.duration_days, mp.price,
                          s.start_date, s.end_date, s.status, s.created_at
                 ORDER BY s.start_date DESC, s.subscription_id DESC`,
                [customerId]
            ),
            pool.query(
                `SELECT
                    b.booking_id,
                    b.status,
                    DATE_FORMAT(b.booked_at, '%Y-%m-%d %H:%i:%s') AS booked_at,
                    DATE_FORMAT(b.cancelled_at, '%Y-%m-%d %H:%i:%s') AS cancelled_at,
                    m.meal_id,
                    DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date,
                    m.meal_type,
                    m.menu,
                    m.price,
                    (b.status IN ('pending', 'confirmed') AND m.meal_date >= CURRENT_DATE) AS is_upcoming,
                    p.payment_status
                 FROM bookings b
                 JOIN meals m ON m.meal_id = b.meal_id
                 LEFT JOIN payments p ON p.booking_id = b.booking_id
                 WHERE b.user_id = ?
                 ORDER BY m.meal_date DESC, b.booking_id DESC`,
                [customerId]
            ),
            pool.query(
                `SELECT
                    p.payment_id,
                    p.subscription_id,
                    p.booking_id,
                    p.amount,
                    p.transaction_reference,
                    p.payment_status,
                    CASE WHEN p.subscription_id IS NOT NULL THEN 'subscription' ELSE 'booking' END AS payment_type,
                    DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date
                 FROM payments p
                 LEFT JOIN subscriptions s ON s.subscription_id = p.subscription_id
                 LEFT JOIN bookings b ON b.booking_id = p.booking_id
                 WHERE COALESCE(s.user_id, b.user_id) = ?
                 ORDER BY p.payment_date DESC, p.payment_id DESC`,
                [customerId]
            ),
            pool.query(
                `SELECT
                    f.feedback_id,
                    f.rating,
                    f.message,
                    DATE_FORMAT(f.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                    DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date,
                    m.meal_type,
                    m.menu
                 FROM feedback f
                 JOIN meals m ON m.meal_id = f.meal_id
                 WHERE f.user_id = ?
                 ORDER BY f.created_at DESC, f.feedback_id DESC`,
                [customerId]
            )
        ]);

        const normalizedSubscriptions = subscriptions[0].map((subscription) => ({
            ...subscription,
            is_current: Boolean(subscription.is_current),
            remaining_days: Number(subscription.remaining_days),
            skipped_days: Number(subscription.skipped_days),
            skip_dates: subscription.skip_dates ? subscription.skip_dates.split(',') : []
        }));
        const normalizedPayments = payments[0].map((payment) => ({
            ...payment,
            amount: Number(payment.amount)
        }));
        const currentSubscription = normalizedSubscriptions.find((subscription) => subscription.is_current) || null;
        const normalizedBookings = bookings[0].map((booking) => ({
            ...booking,
            is_upcoming: Boolean(booking.is_upcoming)
        }));
        const upcomingBookings = normalizedBookings.filter((booking) => booking.is_upcoming);
        const completedPayments = normalizedPayments.filter((payment) => payment.payment_status === 'completed');

        return res.status(200).json({
            success: true,
            customer: customers[0],
            summary: {
                current_subscription: currentSubscription,
                upcoming_booking_count: upcomingBookings.length,
                total_booking_count: bookings[0].length,
                completed_payment_total: completedPayments.reduce((sum, payment) => sum + payment.amount, 0),
                feedback_count: feedback[0].length,
                average_rating: feedback[0].length
                    ? Number((feedback[0].reduce((sum, entry) => sum + Number(entry.rating), 0) / feedback[0].length).toFixed(1))
                    : null
            },
            subscriptions: normalizedSubscriptions,
            bookings: normalizedBookings,
            payments: normalizedPayments,
            feedback: feedback[0]
        });
    } catch (error) {
        console.error('Get customer detail error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch customer details' });
    }
};

module.exports = { getCustomers, getCustomerById };

