// backend/models/users.js
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<number>} - New user ID
     */
    static async create(userData) {
        const { fullName, email, phone, idNumber, gender, password, agreeTerms } = userData;
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Insert user - matches your exact database schema
        const [result] = await pool.query(
            `INSERT INTO registrations (
                full_name, 
                email, 
                phone, 
                id_number,
                gender, 
                password_hash,
                terms_accepted,
                terms_accepted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [fullName, email, phone, idNumber, gender, passwordHash, agreeTerms ? 1 : 0]
        );
        
        return result.insertId;
    }
    
    /**
     * Find user by email
     * @param {string} email - User's email
     * @returns {Promise<Object|null>} - User object or null
     */
    static async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT 
                register_id, 
                full_name, 
                email, 
                phone,
                id_number,
                gender,
                password_hash,
                is_verified,
                terms_accepted,
                terms_accepted_at,
                last_login,
                registered_at
             FROM registrations 
             WHERE email = ?`,
            [email]
        );
        return rows[0] || null;
    }
    
    /**
     * Find user by ID number
     * @param {string} idNumber - User's ID number
     * @returns {Promise<Object|null>} - User object or null
     */
    static async findByIdNumber(idNumber) {
        const [rows] = await pool.query(
            `SELECT register_id, full_name, email, phone, id_number, gender, is_verified
             FROM registrations 
             WHERE id_number = ?`,
            [idNumber]
        );
        return rows[0] || null;
    }
    
    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} - User object or null
     */
    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT 
                register_id, 
                full_name, 
                email, 
                phone, 
                id_number,
                gender,
                is_verified,
                terms_accepted,
                registered_at
             FROM registrations 
             WHERE register_id = ?`,
            [id]
        );
        return rows[0] || null;
    }
    
    /**
     * Verify user email
     * @param {number} registerId - User ID
     * @returns {Promise<void>}
     */
    static async verifyEmail(registerId) {
        await pool.query(
            'UPDATE registrations SET is_verified = TRUE WHERE register_id = ?',
            [registerId]
        );
    }
    
    /**
     * Check if email exists
     * @param {string} email - User's email
     * @returns {Promise<boolean>} - True if exists
     */
    static async emailExists(email) {
        const [rows] = await pool.query(
            'SELECT register_id FROM registrations WHERE email = ?',
            [email]
        );
        return rows.length > 0;
    }
    
    /**
     * Check if ID number exists
     * @param {string} idNumber - User's ID number
     * @returns {Promise<boolean>} - True if exists
     */
    static async idNumberExists(idNumber) {
        const [rows] = await pool.query(
            'SELECT register_id FROM registrations WHERE id_number = ?',
            [idNumber]
        );
        return rows.length > 0;
    }
    
    /**
     * Check if user is verified
     * @param {string} email - User's email
     * @returns {Promise<boolean>} - True if verified
     */
    static async isVerified(email) {
        const [rows] = await pool.query(
            'SELECT is_verified FROM registrations WHERE email = ?',
            [email]
        );
        return rows.length > 0 ? rows[0].is_verified : false;
    }
    
    /**
     * Update last login timestamp
     * @param {number} registerId - User ID
     * @returns {Promise<void>}
     */
    static async updateLastLogin(registerId) {
        await pool.query(
            'UPDATE registrations SET last_login = NOW() WHERE register_id = ?',
            [registerId]
        );
    }
    
    /**
     * Update user password
     * @param {number} userId - User ID
     * @param {string} newPassword - New password (plain text)
     * @returns {Promise<void>}
     */
    static async updatePassword(userId, newPassword) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        await pool.query(
            'UPDATE registrations SET password_hash = ? WHERE register_id = ?',
            [passwordHash, userId]
        );
    }
    
    /**
     * Get user by ID with full details (including password hash for login)
     * @param {number} userId - User ID
     * @returns {Promise<Object|null>} - User object or null
     */
    static async getUserById(userId) {
        const [rows] = await pool.query(
            `SELECT 
                register_id,
                full_name,
                email,
                phone,
                id_number,
                gender,
                password_hash,
                is_verified,
                terms_accepted,
                last_login,
                registered_at
             FROM registrations 
             WHERE register_id = ?`,
            [userId]
        );
        return rows[0] || null;
    }
    
    /**
     * Delete user account
     * @param {number} userId - User ID
     * @returns {Promise<number>} - Affected rows
     */
    static async deleteUser(userId) {
        const [result] = await pool.query(
            'DELETE FROM registrations WHERE register_id = ?',
            [userId]
        );
        return result.affectedRows;
    }
    
    /**
     * Get all users (for admin)
     * @param {number} limit - Limit results
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} - Array of users
     */
    static async getAllUsers(limit = 50, offset = 0) {
        const [rows] = await pool.query(
            `SELECT 
                register_id, 
                full_name, 
                email, 
                phone,
                gender,
                is_verified,
                registered_at
             FROM registrations 
             ORDER BY register_id DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    }
    
    /**
     * Count total users
     * @returns {Promise<number>} - Total user count
     */
    static async countUsers() {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM registrations'
        );
        return rows[0].total;
    }
    
    /**
     * Update user profile
     * @param {number} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<number>} - Affected rows
     */
    static async updateProfile(userId, updateData) {
        const { fullName, phone, gender } = updateData;
        
        const [result] = await pool.query(
            `UPDATE registrations 
             SET full_name = ?, phone = ?, gender = ?
             WHERE register_id = ?`,
            [fullName, phone, gender, userId]
        );
        return result.affectedRows;
    }
}

module.exports = User;