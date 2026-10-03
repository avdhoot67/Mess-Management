const pool = require('../config/db');

// Get all mess plans
const getPlans = async (req, res) => {
    try {
        const [plans] = await pool.query(`
            SELECT
                plan_id,
                plan_name,
                price,
                duration_days,
                description,
                created_by
            FROM mess_plans
            ORDER BY plan_id DESC
        `);

        res.status(200).json({
            success: true,
            plans
        });

    } catch (error) {
        console.error('Get plans error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch mess plans'
        });
    }
};


// Create a new mess plan
const createPlan = async (req, res) => {
    try {
        const {
            plan_name,
            price,
            duration_days,
            description
        } = req.body || {};

        // Basic validation
        if (
            !plan_name ||
            price === undefined ||
            duration_days === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Plan name, price and duration are required'
            });
        }

        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        if (duration_days <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be greater than 0'
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO mess_plans
                (plan_name, price, duration_days, description, created_by)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                plan_name,
                price,
                duration_days,
                description || null,
                req.user.user_id
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Mess plan created successfully',
            plan_id: result.insertId
        });

    } catch (error) {
        console.error('Create plan error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create mess plan'
        });
    }
};

// Update a mess plan - Admin only
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            plan_name,
            price,
            duration_days,
            description
        } = req.body || {};

        if (
            !plan_name ||
            price === undefined ||
            duration_days === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: 'Plan name, price and duration are required'
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        if (Number(duration_days) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Duration must be greater than 0'
            });
        }

        const [result] = await pool.query(
            `
            UPDATE mess_plans
            SET
                plan_name = ?,
                price = ?,
                duration_days = ?,
                description = ?
            WHERE plan_id = ?
            `,
            [
                plan_name,
                price,
                duration_days,
                description || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mess plan not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Mess plan updated successfully'
        });
    } catch (error) {
        console.error('Update plan error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update mess plan'
        });
    }
};

module.exports = {
    getPlans,
    createPlan,
    updatePlan
};