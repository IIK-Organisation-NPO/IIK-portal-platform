// backend/models/PasswordReset.js
const { pool } = require('../config/database');
const crypto = require('crypto');

class PasswordReset {
    /**
     * Create a password reset token for a user
     * @param {number} userId - The user ID
     * @returns {Promise<string>} - The generated token
     */
    static async createToken(userId) {
        // Generate a random token (32 bytes hex)
        const token = crypto.randomBytes(32).toString('hex');
        
        // Delete any existing tokens for this user (cleanup)
        await pool.query(
            'DELETE FROM password_resets WHERE user_id = ?',
            [userId]
        );
        
        // Create new token (expires in 1 hour)
        await pool.query(
            `INSERT INTO password_resets (user_id, token, expires_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
            [userId, token]
        );
        
        return token;
    }
    
    /**
     * Verify a reset token and get the user ID
     * @param {string} token - The reset token
     * @returns {Promise<number|null>} - User ID if valid, null if invalid
     */
    static async verifyToken(token) {
        const [rows] = await pool.query(
            `SELECT user_id, expires_at 
             FROM password_resets 
             WHERE token = ? 
               AND used_at IS NULL 
               AND expires_at > NOW()`,
            [token]
        );
        
        if (rows.length === 0) {
            return null;
        }
        
        return rows[0].user_id;
    }
    
    /**
     * Mark a token as used (after password reset)
     * @param {string} token - The reset token
     * @returns {Promise<void>}
     */
    static async markUsed(token) {
        await pool.query(
            'UPDATE password_resets SET used_at = NOW() WHERE token = ?',
            [token]
        );
    }
    
    /**
     * Delete expired tokens (for cron job)
     * @returns {Promise<number>} - Number of deleted rows
     */
    static async deleteExpiredTokens() {
        const [result] = await pool.query(
            'DELETE FROM password_resets WHERE expires_at < NOW()'
        );
        return result.affectedRows;
    }
    
    /**
     * Check if a token exists for a user
     * @param {number} userId - The user ID
     * @returns {Promise<boolean>} - True if token exists
     */
    static async hasActiveToken(userId) {
        const [rows] = await pool.query(
            `SELECT reset_id 
             FROM password_resets 
             WHERE user_id = ? 
               AND used_at IS NULL 
               AND expires_at > NOW()`,
            [userId]
        );
        return rows.length > 0;
    }
    
    /**
     * Get token details (for debugging)
     * @param {string} token - The reset token
     * @returns {Promise<Object|null>} - Token details
     */
    static async getTokenDetails(token) {
        const [rows] = await pool.query(
            `SELECT 
                p.*,
                r.full_name,
                r.email
             FROM password_resets p
             JOIN registrations r ON p.user_id = r.register_id
             WHERE p.token = ?`,
            [token]
        );
        return rows[0] || null;
    }
    
    /**
     * Delete all tokens for a user
     * @param {number} userId - The user ID
     * @returns {Promise<void>}
     */
    static async deleteUserTokens(userId) {
        await pool.query(
            'DELETE FROM password_resets WHERE user_id = ?',
            [userId]
        );
    }
}

module.exports = PasswordReset;