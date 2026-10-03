CREATE DATABASE IF NOT EXISTS mess_management;
USE mess_management;

-- ============================================
-- 1. USERS
-- ============================================

CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    password VARCHAR(255) NULL,

    google_sub VARCHAR(255) NULL UNIQUE,

    phone VARCHAR(15) NULL,

    role ENUM('student', 'admin')
        NOT NULL DEFAULT 'student',

    session_version INT UNSIGNED
        NOT NULL DEFAULT 0,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 1A. SHORT-LIVED AUTH EXCHANGE GRANTS
-- ============================================

CREATE TABLE auth_exchange_grants (
    grant_hash CHAR(64) PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auth_grant_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_auth_grants_expiry (expires_at)
);

-- ============================================
-- 1B. PASSWORD RESET TOKENS
-- ============================================

CREATE TABLE password_reset_tokens (
    token_hash CHAR(64) PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    INDEX idx_password_reset_user (user_id),
    INDEX idx_password_reset_expiry (expires_at)
);

-- ============================================
-- 1C. REFRESH TOKENS
-- ============================================

CREATE TABLE refresh_tokens (
    token_hash CHAR(64) PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    session_version INT UNSIGNED NOT NULL,

    expires_at DATETIME NOT NULL,

    revoked_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_refresh_tokens_user (user_id),
    KEY idx_refresh_tokens_expiry (expires_at),

    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================
-- 1D. ADMIN INVITATIONS
-- ============================================

CREATE TABLE admin_invitations (
    invitation_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    invited_by INT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    accepted_at DATETIME NULL,
    revoked_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_invitation_inviter
        FOREIGN KEY (invited_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_admin_invitation_expiry (expires_at)
);


-- ============================================
-- 2. MESS PLANS
-- ============================================

CREATE TABLE mess_plans (
    plan_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    plan_name VARCHAR(100) NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    duration_days INT UNSIGNED NOT NULL,

    description TEXT NULL,

    created_by INT UNSIGNED NOT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_plan_price
        CHECK (price >= 0),

    CONSTRAINT chk_plan_duration
        CHECK (duration_days > 0),

    CONSTRAINT fk_plan_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================
-- 3. SUBSCRIPTIONS
-- ============================================

CREATE TABLE subscriptions (
    subscription_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    plan_id INT UNSIGNED NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM('pending', 'active', 'expired', 'cancelled')
        NOT NULL DEFAULT 'active',

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_subscription_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_subscription_plan
        FOREIGN KEY (plan_id)
        REFERENCES mess_plans(plan_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_subscription_dates
        CHECK (end_date >= start_date),

    INDEX idx_subscriptions_user_status (user_id, status)
);


-- ============================================
-- 4. MEALS
-- ============================================

CREATE TABLE meals (
    meal_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    meal_date DATE NOT NULL,

    meal_type ENUM('breakfast', 'lunch', 'dinner')
        NOT NULL,

    menu TEXT NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    created_by INT UNSIGNED NOT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_meal_price
        CHECK (price >= 0),

    CONSTRAINT fk_meal_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_meal_date_type
        UNIQUE (meal_date, meal_type)
);


-- ============================================
-- 5. BOOKINGS
-- ============================================

CREATE TABLE bookings (
    booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    meal_id INT UNSIGNED NOT NULL,

    status ENUM('pending', 'confirmed', 'cancelled')
		NOT NULL DEFAULT 'pending',

    booked_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    cancelled_at TIMESTAMP NULL,

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_booking_meal
        FOREIGN KEY (meal_id)
        REFERENCES meals(meal_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_user_meal_booking
        UNIQUE (user_id, meal_id)
);


-- ============================================
-- 6. PAYMENTS
-- ============================================

CREATE TABLE payments (
    payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    booking_id INT UNSIGNED NULL,

    subscription_id INT UNSIGNED NULL,

    amount DECIMAL(10,2) NOT NULL,
    
    transaction_reference VARCHAR(100) NULL,

    payment_status ENUM('pending', 'completed', 'failed')
        NOT NULL DEFAULT 'pending',

    payment_date TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(subscription_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_payment_reference
        CHECK (
            (booking_id IS NOT NULL AND subscription_id IS NULL)
            OR
            (booking_id IS NULL AND subscription_id IS NOT NULL)
        ),

    KEY idx_payment_booking (booking_id),

    KEY idx_payment_transaction_reference (transaction_reference),

    CONSTRAINT uq_payment_subscription
        UNIQUE (subscription_id)
);


-- ============================================
-- 7. DAY SKIPS
-- ============================================

CREATE TABLE day_skips (
    skip_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subscription_id INT UNSIGNED NOT NULL,

    skip_date DATE NOT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_skip_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(subscription_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_subscription_skip_date
        UNIQUE (subscription_id, skip_date)
);


-- ============================================
-- 8. FEEDBACK
-- ============================================

CREATE TABLE feedback (
    feedback_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    meal_id INT UNSIGNED NOT NULL,

    rating INT UNSIGNED NOT NULL,

    message TEXT NULL,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_feedback_meal
        FOREIGN KEY (meal_id)
        REFERENCES meals(meal_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_feedback_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT uq_feedback_user_meal
        UNIQUE (user_id, meal_id)
);


-- ============================================
-- 9. AI FEEDBACK INSIGHT RUNS
-- ============================================

CREATE TABLE feedback_insight_runs (
    insight_run_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    cache_key CHAR(64) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner') NULL,
    sample_count INT UNSIGNED NOT NULL,
    analysis_json JSON NOT NULL,

    created_by INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    KEY idx_feedback_insight_cache (cache_key, expires_at),

    CONSTRAINT fk_feedback_insight_admin
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================
-- 10. AI FEEDBACK INSIGHT QUOTA EVENTS
-- ============================================

CREATE TABLE feedback_insight_quota_events (
    insight_quota_event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id INT UNSIGNED NOT NULL,

    status ENUM('reserved', 'completed')
        NOT NULL DEFAULT 'reserved',

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_feedback_insight_quota_admin_created (admin_id, created_at),

    CONSTRAINT fk_feedback_insight_quota_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
