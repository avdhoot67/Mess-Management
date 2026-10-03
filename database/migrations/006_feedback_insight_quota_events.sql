CREATE TABLE IF NOT EXISTS feedback_insight_quota_events (
    insight_quota_event_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    status ENUM('reserved', 'completed') NOT NULL DEFAULT 'reserved',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_feedback_insight_quota_admin_created (admin_id, created_at),
    CONSTRAINT fk_feedback_insight_quota_admin
        FOREIGN KEY (admin_id) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
