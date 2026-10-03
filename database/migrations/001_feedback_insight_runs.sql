CREATE TABLE IF NOT EXISTS feedback_insight_runs (
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
    INDEX idx_feedback_insight_cache (cache_key, expires_at),
    CONSTRAINT fk_feedback_insight_admin
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
