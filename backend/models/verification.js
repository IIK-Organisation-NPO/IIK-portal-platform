// backend/models/verification.js
const { pool } = require('../config/database');
const crypto = require('crypto');

class Verification {
    /**
     * Create a verification token for a user
     * @param {number} registerId - User ID
     * @returns {Promise<string>} - The generated token
     */
    static async createToken(registerId) {
        // Generate a random token (32 bytes hex)
        const token = crypto.randomBytes(32).toString('hex');
        
        // Insert token - matches your exact database schema
        await pool.query(
            `INSERT INTO email_verifications (register_id, token, expires_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
            [registerId, token]
        );
        
        return token;
    }
    
    /**
     * Verify a token and get the user ID
     * @param {string} token - The verification token
     * @returns {Promise<number|null>} - User ID if valid, null if invalid
     */
    static async verifyToken(token) {
        // Check if token exists, not used, and not expired
        const [rows] = await pool.query(
            `SELECT register_id, expires_at 
             FROM email_verifications 
             WHERE token = ? 
               AND verified_at IS NULL 
               AND expires_at > NOW()`,
            [token]
        );
        
        if (rows.length === 0) {
            return null;
        }
        
        const registerId = rows[0].register_id;
        
        // Mark token as verified/used
        await pool.query(
            'UPDATE email_verifications SET verified_at = NOW() WHERE token = ?',
            [token]
        );
        
        return registerId;
    }
    
    /**
     * Check if a token is valid (without marking it used)
     * @param {string} token - The verification token
     * @returns {Promise<boolean>} - True if valid
     */
    static async isValidToken(token) {
        const [rows] = await pool.query(
            `SELECT register_id 
             FROM email_verifications 
             WHERE token = ? 
               AND verified_at IS NULL 
               AND expires_at > NOW()`,
            [token]
        );
        return rows.length > 0;
    }
    
    /**
     * Get verification status for a user
     * @param {number} registerId - User ID
     * @returns {Promise<Object|null>} - Verification status
     */
    static async getVerificationStatus(registerId) {
        const [rows] = await pool.query(
            `SELECT verified_at, expires_at, created_at
             FROM email_verifications 
             WHERE register_id = ? 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [registerId]
        );
        return rows[0] || null;
    }
    
    /**
     * Delete expired tokens (for cron jobs)
     * @returns {Promise<number>} - Number of deleted rows
     */
    static async deleteExpiredTokens() {
        const [result] = await pool.query(
            'DELETE FROM email_verifications WHERE expires_at < NOW()'
        );
        return result.affectedRows;
    }
    
    /**
     * Delete all tokens for a user
     * @param {number} registerId - User ID
     * @returns {Promise<void>}
     */
    static async deleteUserTokens(registerId) {
        await pool.query(
            'DELETE FROM email_verifications WHERE register_id = ?',
            [registerId]
        );
    }
    
    /**
     * Get token details (for debugging)
     * @param {string} token - The verification token
     * @returns {Promise<Object|null>} - Token details
     */
    static async getTokenDetails(token) {
        const [rows] = await pool.query(
            `SELECT 
                v.*,
                r.full_name,
                r.email
             FROM email_verifications v
             JOIN registrations r ON v.register_id = r.register_id
             WHERE v.token = ?`,
            [token]
        );
        return rows[0] || null;
    }
    
    /**
     * Resend verification email - generate new token
     * @param {number} registerId - User ID
     * @returns {Promise<string>} - New token
     */
    static async resendToken(registerId) {
        // Delete old tokens for this user
        await this.deleteUserTokens(registerId);
        
        // Create new token
        return await this.createToken(registerId);
    }
}

module.exports = Verification;