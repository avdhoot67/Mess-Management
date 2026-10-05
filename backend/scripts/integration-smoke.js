require('dotenv').config();

const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../src/config/db');

const apiBaseUrl = process.env.INTEGRATION_API_URL || 'http://localhost:5001/api';
const marker = `INT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const password = 'IntegrationPass123';
const studentEmail = `student-${marker.toLowerCase()}@example.invalid`;
const adminEmail = `admin-${marker.toLowerCase()}@example.invalid`;
let studentId;
let adminId;

const request = async (path, { method = 'GET', token, cookie, body } = {}) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.arrayBuffer();
    return { response, data, cookie: response.headers.getSetCookie?.()[0]?.split(';')[0] || null };
};

const expectStatus = (result, status, label) => {
    assert.equal(result.response.status, status, `${label}: ${JSON.stringify(result.data)}`);
};

const cleanup = async () => {
    if (!studentId && !adminId) return;

    const userIds = [studentId, adminId].filter(Boolean);
    await pool.query(
        `DELETE ds FROM day_skips ds
         JOIN subscriptions s ON s.subscription_id = ds.subscription_id
         WHERE s.user_id IN (?)`,
        [userIds]
    );
    await pool.query(
        `DELETE f FROM feedback f
         WHERE f.user_id IN (?)`,
        [userIds]
    );
    await pool.query(
        `DELETE p FROM payments p
         LEFT JOIN bookings b ON b.booking_id = p.booking_id
         LEFT JOIN subscriptions s ON s.subscription_id = p.subscription_id
         WHERE b.user_id IN (?) OR s.user_id IN (?)`,
        [userIds, userIds]
    );
    await pool.query('DELETE FROM bookings WHERE user_id IN (?)', [userIds]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?)', [userIds]);
    if (adminId) {
        await pool.query('DELETE FROM meals WHERE created_by = ?', [adminId]);
        await pool.query('DELETE FROM mess_plans WHERE created_by = ?', [adminId]);
    }
    await pool.query('DELETE FROM refresh_tokens WHERE user_id IN (?)', [userIds]);
    await pool.query('DELETE FROM users WHERE user_id IN (?)', [userIds]);
};

(async () => {
    try {
        const adminHash = await bcrypt.hash(password, 10);
        const [adminResult] = await pool.query(
            `INSERT INTO users (name, email, password, phone, role)
             VALUES (?, ?, ?, ?, 'admin')`,
            [`Integration Admin ${marker}`, adminEmail, adminHash, '9999999999']
        );
        adminId = adminResult.insertId;

        const registration = await request('/auth/register', {
            method: 'POST',
            body: { name: `Integration Student ${marker}`, email: studentEmail, password, phone: '8888888888' }
        });
        expectStatus(registration, 201, 'Student registration');
        studentId = registration.data.user_id;

        const studentLogin = await request('/auth/login', {
            method: 'POST', body: { email: studentEmail, password }
        });
        expectStatus(studentLogin, 200, 'Student login');
        assert.ok(studentLogin.data.token && studentLogin.cookie, 'Login must return an access token and refresh cookie');

        const account = await request('/auth/account', { token: studentLogin.data.token });
        expectStatus(account, 200, 'Protected account access');
        assert.equal(account.data.account.email, studentEmail);

        const refreshed = await request('/auth/refresh', { method: 'POST', cookie: studentLogin.cookie });
        expectStatus(refreshed, 200, 'Refresh-token rotation');
        assert.ok(refreshed.data.token && refreshed.cookie, 'Refresh must rotate the cookie and return a new access token');

        const adminLogin = await request('/auth/login', {
            method: 'POST', body: { email: adminEmail, password }
        });
        expectStatus(adminLogin, 200, 'Admin login');
        const studentAdminAccess = await request('/payments/admin', { token: refreshed.data.token });
        expectStatus(studentAdminAccess, 403, 'Student admin-access rejection');
        const studentCustomerAccess = await request('/customers', { token: refreshed.data.token });
        expectStatus(studentCustomerAccess, 403, 'Student customer-directory rejection');

        const [planResult] = await pool.query(
            `INSERT INTO mess_plans (plan_name, price, duration_days, description, created_by)
             VALUES (?, 500, 14, 'Integration test plan', ?)`,
            [`${marker} Plan`, adminId]
        );
        const subscriptionRequest = await request('/subscriptions', {
            method: 'POST',
            token: refreshed.data.token,
            body: { plan_id: planResult.insertId, transaction_reference: `${marker}-SUB` }
        });
        expectStatus(subscriptionRequest, 201, 'Subscription payment submission');

        const approveSubscription = await request(`/payments/${subscriptionRequest.data.payment.payment_id}/approve`, {
            method: 'POST', token: adminLogin.data.token
        });
        expectStatus(approveSubscription, 200, 'Subscription payment approval');

        const tomorrow = await pool.query("SELECT DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d') AS date");
        const skip = await request('/skips', {
            method: 'POST',
            token: refreshed.data.token,
            body: { subscription_id: subscriptionRequest.data.subscription.subscription_id, skip_date: tomorrow[0][0].date }
        });
        expectStatus(skip, 201, 'Subscription day skip');

        const [futureMeal] = await pool.query(
            `INSERT INTO meals (meal_date, meal_type, menu, price, created_by)
             VALUES (DATE_ADD(CURDATE(), INTERVAL 47 DAY), 'breakfast', ?, 80, ?)`,
            [`${marker} Future meal`, adminId]
        );
        const booking = await request('/bookings', {
            method: 'POST',
            token: refreshed.data.token,
            body: { meal_id: futureMeal.insertId, transaction_reference: `${marker}-BOOK` }
        });
        expectStatus(booking, 201, 'Individual booking payment submission');

        const customerDirectory = await request(`/customers?search=${encodeURIComponent(studentEmail)}&segment=both`, {
            token: adminLogin.data.token
        });
        expectStatus(customerDirectory, 200, 'Admin customer-directory access');
        assert.equal(customerDirectory.data.customers.length, 1, 'Customer directory should find the integration student');
        assert.equal(customerDirectory.data.customers[0].service_state, 'both');
        assert.equal(customerDirectory.data.customers[0].password, undefined, 'Customer list must not expose password hashes');
        assert.equal(customerDirectory.data.customers[0].google_sub, undefined, 'Customer list must not expose Google identifiers');

        const customerProfile = await request(`/customers/${studentId}`, { token: adminLogin.data.token });
        expectStatus(customerProfile, 200, 'Admin customer-profile access');
        assert.equal(customerProfile.data.customer.email, studentEmail);
        assert.equal(customerProfile.data.summary.current_subscription.subscription_id, subscriptionRequest.data.subscription.subscription_id);
        assert.equal(customerProfile.data.summary.upcoming_booking_count, 1);
        assert.equal(customerProfile.data.customer.session_version, undefined, 'Customer profile must not expose session state');

        const receipt = await request(`/payments/${booking.data.payment.payment_id}/receipt`, { token: refreshed.data.token });
        expectStatus(receipt, 200, 'Student payment receipt');
        assert.match(receipt.response.headers.get('content-type') || '', /application\/pdf/);

        const cancelled = await request(`/bookings/${booking.data.booking.booking_id}/cancel`, {
            method: 'PATCH', token: refreshed.data.token
        });
        expectStatus(cancelled, 200, 'Future booking cancellation');

        const [pastMeal] = await pool.query(
            `INSERT INTO meals (meal_date, meal_type, menu, price, created_by)
             VALUES ('2001-01-01', 'dinner', ?, 80, ?)`,
            [`${marker} Past meal`, adminId]
        );
        const [pastBooking] = await pool.query(
            "INSERT INTO bookings (user_id, meal_id, status) VALUES (?, ?, 'confirmed')",
            [studentId, pastMeal.insertId]
        );
        const blockedCancellation = await request(`/bookings/${pastBooking.insertId}/cancel`, {
            method: 'PATCH', token: refreshed.data.token
        });
        expectStatus(blockedCancellation, 400, 'Past booking cancellation rejection');

        const feedback = await request('/feedback', {
            method: 'POST', token: refreshed.data.token,
            body: { meal_id: pastMeal.insertId, rating: 4, message: `${marker} feedback message` }
        });
        expectStatus(feedback, 201, 'Eligible feedback submission');
        const duplicateFeedback = await request('/feedback', {
            method: 'POST', token: refreshed.data.token,
            body: { meal_id: pastMeal.insertId, rating: 4, message: `${marker} duplicate` }
        });
        expectStatus(duplicateFeedback, 409, 'Duplicate feedback rejection');

        const insight = await request('/feedback/admin/insights/generate', {
            method: 'POST', token: adminLogin.data.token,
            body: { start_date: '2001-01-01', end_date: '2001-01-01' }
        });
        if (process.env.AI_PROVIDER === 'gemini' && process.env.GEMINI_API_KEY) {
            expectStatus(insight, 422, 'AI minimum-feedback guard');
        } else {
            expectStatus(insight, 503, 'Unconfigured AI rejection');
        }

        const logout = await request('/auth/logout', { method: 'POST', cookie: refreshed.cookie });
        expectStatus(logout, 200, 'Logout');
        const revokedRefresh = await request('/auth/refresh', { method: 'POST', cookie: refreshed.cookie });
        expectStatus(revokedRefresh, 401, 'Revoked refresh-token rejection');

        console.log('Integration smoke suite passed.');
    } finally {
        await cleanup();
        await pool.end();
    }
})().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
});
