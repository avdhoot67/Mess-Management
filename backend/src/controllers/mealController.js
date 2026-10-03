const pool = require('../config/db');

// Create a meal - Admin only
const createMeal = async (req, res) => {
    try {
        const { meal_date, meal_type, menu, price } = req.body || {};

        if (!meal_date || !meal_type || !menu || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Meal date, meal type, menu and price are required'
            });
        }

        const validMealTypes = ['breakfast', 'lunch', 'dinner'];

        if (!validMealTypes.includes(meal_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meal type'
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO meals
                (meal_date, meal_type, menu, price, created_by)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                meal_date,
                meal_type,
                menu,
                price,
                req.user.user_id
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Meal created successfully',
            meal_id: result.insertId
        });

    } catch (error) {
        console.error('Create meal error:', error);

        // Duplicate date + meal type
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'A meal of this type already exists for this date'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create meal'
        });
    }
};


// Get all meals
const getMeals = async (req, res) => {
    try {
        const { date } = req.query;

        let query = `
            SELECT
                m.meal_id,
                DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS
                meal_date,
                m.meal_type,
                m.menu,
                m.price,
                m.created_by,
                u.name AS created_by_name
            FROM meals m
            JOIN users u
                ON m.created_by = u.user_id
        `;

        const params = [];

        if (date) {
            query += ` WHERE m.meal_date = ?`;
            params.push(date);
        }

        query += ` ORDER BY m.meal_date ASC,
                   FIELD(m.meal_type, 'breakfast', 'lunch', 'dinner')`;

        const [meals] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: meals.length,
            meals
        });

    } catch (error) {
        console.error('Get meals error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch meals'
        });
    }
};


// Get one meal
const getMealById = async (req, res) => {
    try {
        const { id } = req.params;

        const [meals] = await pool.query(
            `
            SELECT
                m.meal_id,
                DATE_FORMAT(m.meal_date, '%Y-%m-%d') AS
                meal_date,
                m.meal_type,
                m.menu,
                m.price,
                m.created_by,
                u.name AS created_by_name
            FROM meals m
            JOIN users u
                ON m.created_by = u.user_id
            WHERE m.meal_id = ?
            `,
            [id]
        );

        if (meals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        res.status(200).json({
            success: true,
            meal: meals[0]
        });

    } catch (error) {
        console.error('Get meal error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch meal'
        });
    }
};


// Update a meal - Admin only
const updateMeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { meal_date, meal_type, menu, price } = req.body || {};

        if (!meal_date || !meal_type || !menu || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Meal date, meal type, menu and price are required'
            });
        }

        const validMealTypes = ['breakfast', 'lunch', 'dinner'];

        if (!validMealTypes.includes(meal_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meal type'
            });
        }

        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        const [result] = await pool.query(
            `
            UPDATE meals
            SET
                meal_date = ?,
                meal_type = ?,
                menu = ?,
                price = ?
            WHERE meal_id = ?
            `,
            [meal_date, meal_type, menu, price, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Meal updated successfully'
        });

    } catch (error) {
        console.error('Update meal error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'A meal of this type already exists for this date'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update meal'
        });
    }
};


// Delete a meal - Admin only
const deleteMeal = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `
            DELETE FROM meals
            WHERE meal_id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Meal not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Meal deleted successfully'
        });

    } catch (error) {
        console.error('Delete meal error:', error);

        // Meal is referenced by another table
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete this meal because it has related records'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to delete meal'
        });
    }
};


module.exports = {
    createMeal,
    getMeals,
    getMealById,
    updateMeal,
    deleteMeal
};