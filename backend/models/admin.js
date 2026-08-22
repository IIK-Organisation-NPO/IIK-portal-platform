// backend/models/admin.js
const { pool } = require('../config/database');

class Admin {
    /**
     * Find admin by email
     * @param {string} email - Admin email
     * @returns {Promise<Object|null>} - Admin object or null
     */
    static async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT 
                admin_id,
                email,
                password,  -- plain text (for now)
                center_name,
                created_at
             FROM admins 
             WHERE email = ?`,
            [email]
        );
        return rows[0] || null;
    }
    
    /**
     * Check if admin exists
     * @param {string} email - Admin email
     * @returns {Promise<boolean>} - True if exists
     */
    static async exists(email) {
        const [rows] = await pool.query(
            'SELECT admin_id FROM admins WHERE email = ?',
            [email]
        );
        return rows.length > 0;
    }
    
    /**
     * Get all admins
     * @returns {Promise<Array>} - Array of admins
     */
    static async getAll() {
        const [rows] = await pool.query(
            `SELECT 
                admin_id,
                email,
                center_name,
                created_at
             FROM admins 
             ORDER BY center_name`
        );
        return rows;
    }
    
    /**
     * Get admin by ID
     * @param {number} adminId - Admin ID
     * @returns {Promise<Object|null>} - Admin object or null
     */
    static async findById(adminId) {
        const [rows] = await pool.query(
            `SELECT 
                admin_id,
                email,
                center_name,
                created_at
             FROM admins 
             WHERE admin_id = ?`,
            [adminId]
        );
        return rows[0] || null;
    }
}

module.exports = Admin;