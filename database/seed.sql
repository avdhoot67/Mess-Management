USE mess_management;

-- ============================================
-- USERS
-- ============================================

INSERT INTO users
(name, email, password, phone, role)
VALUES
(
    'Mess Admin',
    'admin@messmanagement.com',
    '$2b$10$fgYbCzKkQ9oi9VJV01eKwOe5l/E3GGaPVtU9T//j4IoGYkKSboSMm',
    '9876543210',
    'admin'
),
(
    'Aarav Sharma',
    'aarav@student.com',
    '$2b$10$hR88ZXSMFe.D4jv/kBEMO.5pBQbFcpinJf8LZuLxnhbzZe9eFmNl6',
    '9876543211',
    'student'
),
(
    'Riya Patil',
    'riya@student.com',
    '$2b$10$hR88ZXSMFe.D4jv/kBEMO.5pBQbFcpinJf8LZuLxnhbzZe9eFmNl6',
    '9876543212',
    'student'
),
(
    'Aditya Joshi',
    'aditya@student.com',
    '$2b$10$hR88ZXSMFe.D4jv/kBEMO.5pBQbFcpinJf8LZuLxnhbzZe9eFmNl6',
    '9876543213',
    'student'
);


-- ============================================
-- MESS PLANS
-- ============================================

INSERT INTO mess_plans
(plan_name, price, duration_days, description, created_by)
VALUES
(
    'Weekly Plan',
    1200.00,
    7,
    'Mess access for 7 days.',
    1
),
(
    'Monthly Plan',
    4500.00,
    30,
    'Mess access for 30 days.',
    1
),
(
    'Quarterly Plan',
    12000.00,
    90,
    'Mess access for 90 days.',
    1
);


-- ============================================
-- MEALS
-- ============================================

INSERT INTO meals
(meal_date, meal_type, menu, price, created_by)
VALUES
('2026-08-15', 'breakfast', 'Poha, Tea, Banana', 40.00, 1),
('2026-08-15', 'lunch', 'Rice, Dal, Roti, Paneer', 80.00, 1),
('2026-08-15', 'dinner', 'Rice, Dal, Roti, Mix Veg', 75.00, 1),

('2026-08-16', 'breakfast', 'Upma, Tea, Fruit', 40.00, 1),
('2026-08-16', 'lunch', 'Rice, Dal, Roti, Chole', 80.00, 1),
('2026-08-16', 'dinner', 'Pulao, Raita, Roti, Sabzi', 75.00, 1),

('2026-08-17', 'breakfast', 'Idli, Sambar, Tea', 45.00, 1),
('2026-08-17', 'lunch', 'Rice, Dal, Roti, Veg Kolhapuri', 85.00, 1),
('2026-08-17', 'dinner', 'Khichdi, Curd, Papad', 70.00, 1);


-- ============================================
-- SUBSCRIPTIONS
-- ============================================

INSERT INTO subscriptions
(user_id, plan_id, start_date, end_date, status)
VALUES
(
    2,
    2,
    '2026-08-15',
    '2026-09-13',
    'active'
),
(
    3,
    1,
    '2026-08-15',
    '2026-08-21',
    'active'
);


-- ============================================
-- BOOKINGS
-- ============================================

INSERT INTO bookings
(user_id, meal_id, status)
VALUES
(2, 2, 'confirmed'),
(3, 4, 'confirmed'),
(4, 5, 'confirmed');


-- ============================================
-- PAYMENTS
-- ============================================

INSERT INTO payments
(subscription_id, booking_id, amount, payment_status)
VALUES
(1, NULL, 4500.00, 'completed');

INSERT INTO payments
(subscription_id, booking_id, amount, payment_status)
VALUES
(2, NULL, 1200.00, 'completed');

INSERT INTO payments
(subscription_id, booking_id, amount, payment_status)
VALUES
(NULL, 1, 80.00, 'completed');

INSERT INTO payments
(subscription_id, booking_id, amount, payment_status)
VALUES
(NULL, 2, 40.00, 'completed');


-- ============================================
-- DAY SKIPS
-- ============================================

INSERT INTO day_skips
(subscription_id, skip_date)
VALUES
(1, '2026-08-20');


-- ============================================
-- FEEDBACK
-- ============================================

INSERT INTO feedback
(user_id, meal_id, rating, message)
VALUES
(
    2,
    2,
    5,
    'Lunch was very good today.'
),
(
    3,
    4,
    4,
    'Breakfast was tasty and fresh.'
);