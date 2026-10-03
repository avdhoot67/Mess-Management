const pool = require('../../config/db');

const getFeedbackDataset = async ({ startDate, endDate, mealType }) => {
    const filter = mealType ? 'AND m.meal_type = ?' : '';
    const params = mealType ? [startDate, endDate, mealType] : [startDate, endDate];

    const [summaryRows] = await pool.query(
        `SELECT COUNT(*) AS feedback_count,
                ROUND(AVG(f.rating), 2) AS average_rating,
                SUM(CASE WHEN f.message IS NOT NULL AND TRIM(f.message) <> '' THEN 1 ELSE 0 END) AS written_feedback_count
         FROM feedback f
         JOIN meals m ON m.meal_id = f.meal_id
         WHERE m.meal_date BETWEEN ? AND ? ${filter}`,
        params
    );

    const [mealTypeRows] = await pool.query(
        `SELECT m.meal_type,
                COUNT(*) AS feedback_count,
                ROUND(AVG(f.rating), 2) AS average_rating
         FROM feedback f
         JOIN meals m ON m.meal_id = f.meal_id
         WHERE m.meal_date BETWEEN ? AND ? ${filter}
         GROUP BY m.meal_type
         ORDER BY FIELD(m.meal_type, 'breakfast', 'lunch', 'dinner')`,
        params
    );

    const [writtenFeedback] = await pool.query(
        `SELECT DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS meal_date,
                m.meal_type,
                f.rating,
                TRIM(f.message) AS message
         FROM feedback f
         JOIN meals m ON m.meal_id = f.meal_id
         WHERE m.meal_date BETWEEN ? AND ?
           AND f.message IS NOT NULL
           AND TRIM(f.message) <> ''
           ${filter}
         ORDER BY m.meal_date DESC, f.feedback_id DESC
         LIMIT 50`,
        params
    );

    return {
        statistics: {
            feedback_count: Number(summaryRows[0].feedback_count),
            average_rating: summaryRows[0].average_rating === null ? null : Number(summaryRows[0].average_rating),
            written_feedback_count: Number(summaryRows[0].written_feedback_count),
            meal_type_ratings: mealTypeRows.map((row) => ({
                meal_type: row.meal_type,
                feedback_count: Number(row.feedback_count),
                average_rating: Number(row.average_rating)
            }))
        },
        writtenFeedback
    };
};

const findCachedInsight = async ({ cacheKey }) => {
    const [rows] = await pool.query(
        `SELECT analysis_json, created_at
         FROM feedback_insight_runs
         WHERE cache_key = ? AND expires_at > NOW()
         ORDER BY insight_run_id DESC
         LIMIT 1`,
        [cacheKey]
    );

    if (!rows.length) return null;

    return {
        analysis: typeof rows[0].analysis_json === 'string'
            ? JSON.parse(rows[0].analysis_json)
            : rows[0].analysis_json,
        generatedAt: rows[0].created_at
    };
};

const saveInsight = async ({ cacheKey, startDate, endDate, mealType, sampleCount, analysis, createdBy }) => {
    await pool.query(
        `INSERT INTO feedback_insight_runs
            (cache_key, start_date, end_date, meal_type, sample_count, analysis_json, created_by, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 6 HOUR))`,
        [cacheKey, startDate, endDate, mealType || null, sampleCount, JSON.stringify(analysis), createdBy]
    );
};

const reserveInsightQuota = async ({ adminId }) => {
    const connection = await pool.getConnection();
    const lockName = `messmate-feedback-insight-quota:${adminId}`;
    let hasLock = false;

    try {
        const [[lock]] = await connection.query('SELECT GET_LOCK(?, 3) AS acquired', [lockName]);
        hasLock = Boolean(lock.acquired);
        if (!hasLock) {
            const error = new Error('Feedback analysis is busy. Please try again in a moment.');
            error.statusCode = 503;
            throw error;
        }

        await connection.query(
            `DELETE FROM feedback_insight_quota_events
             WHERE status = 'reserved'
               AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
        );

        const [[count]] = await connection.query(
            `SELECT COUNT(*) AS generation_count
             FROM feedback_insight_quota_events
             WHERE admin_id = ?
               AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
            [adminId]
        );

        if (Number(count.generation_count) >= 5) {
            const error = new Error('You can generate up to 5 feedback insights per hour.');
            error.statusCode = 429;
            throw error;
        }

        const [result] = await connection.query(
            `INSERT INTO feedback_insight_quota_events (admin_id, status)
             VALUES (?, 'reserved')`,
            [adminId]
        );

        return result.insertId;
    } finally {
        if (hasLock) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
        connection.release();
    }
};

const completeInsightQuotaReservation = async ({ reservationId }) => {
    await pool.query(
        `UPDATE feedback_insight_quota_events
         SET status = 'completed'
         WHERE insight_quota_event_id = ? AND status = 'reserved'`,
        [reservationId]
    );
};

const releaseInsightQuotaReservation = async ({ reservationId }) => {
    await pool.query(
        `DELETE FROM feedback_insight_quota_events
         WHERE insight_quota_event_id = ? AND status = 'reserved'`,
        [reservationId]
    );
};

module.exports = {
    completeInsightQuotaReservation,
    findCachedInsight,
    getFeedbackDataset,
    releaseInsightQuotaReservation,
    reserveInsightQuota,
    saveInsight
};
