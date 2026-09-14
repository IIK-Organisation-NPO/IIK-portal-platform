const { pool } = require('../config/database');

class OTP {
    // ===== CREATE OTP =====
    static async create(userId, email, otpCode, expiresInMinutes = 10) {
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

        // Delete any existing unused OTP for this user
        await this.deleteByUserId(userId);

        const query = `
            INSERT INTO password_reset (
                user_id,
                otp,
                expire_at,
                created_at
            ) VALUES (?, ?, ?, NOW())
        `;

        const [result] = await pool.execute(query, [
            userId,
            otpCode,
            expiresAt
        ]);

        return {
            otp_id: result.insertId,
            userId,
            email,
            otpCode,
            expiresAt
        };
    }

    // ===== VERIFY OTP =====
    static async verify(email, otpCode) {
        // First, find the user by email
        const [userRows] = await pool.execute(
            'SELECT User_id FROM user WHERE email = ?',
            [email]
        );

        if (userRows.length === 0) {
            return { 
                success: false, 
                message: 'User not found' 
            };
        }

        const userId = userRows[0].User_id;

        // Check for valid OTP
        const [rows] = await pool.execute(
            `SELECT * FROM password_reset 
             WHERE user_id = ? 
             AND otp = ? 
             AND use_at IS NULL 
             AND expire_at > NOW()
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId, otpCode]
        );

        if (rows.length === 0) {
            // Check if OTP expired
            const [expiredRows] = await pool.execute(
                `SELECT * FROM password_reset 
                 WHERE user_id = ? 
                 AND otp = ? 
                 AND use_at IS NULL 
                 AND expire_at <= NOW()
                 ORDER BY created_at DESC 
                 LIMIT 1`,
                [userId, otpCode]
            );

            if (expiredRows.length > 0) {
                return { 
                    success: false, 
                    message: 'OTP has expired. Please request a new one.' 
                };
            }

            // Check if OTP already used
            const [usedRows] = await pool.execute(
                `SELECT * FROM password_reset 
                 WHERE user_id = ? 
                 AND otp = ? 
                 AND use_at IS NOT NULL
                 ORDER BY created_at DESC 
                 LIMIT 1`,
                [userId, otpCode]
            );

            if (usedRows.length > 0) {
                return { 
                    success: false, 
                    message: 'This OTP has already been used.' 
                };
            }

            return { 
                success: false, 
                message: 'Invalid OTP code. Please try again.' 
            };
        }

        const otpData = rows[0];

        // Mark OTP as used
        await pool.execute(
            'UPDATE password_reset SET use_at = NOW() WHERE password_reset_id = ?',
            [otpData.password_reset_id]
        );

        return { 
            success: true, 
            message: 'OTP verified successfully!',
            userId: userId
        };
    }

    // ===== DELETE OTP BY USER ID =====
    static async deleteByUserId(userId) {
        const query = 'DELETE FROM password_reset WHERE user_id = ? AND use_at IS NULL';
        await pool.execute(query, [userId]);
    }

    // ===== DELETE EXPIRED OTPs =====
    static async deleteExpired() {
        const query = 'DELETE FROM password_reset WHERE expire_at <= NOW() AND use_at IS NULL';
        const [result] = await pool.execute(query);
        return result.affectedRows;
    }

    // ===== GET OTP STATUS =====
    static async getStatus(email) {
        const [userRows] = await pool.execute(
            'SELECT User_id FROM user WHERE email = ?',
            [email]
        );

        if (userRows.length === 0) {
            return null;
        }

        const userId = userRows[0].User_id;

        const [rows] = await pool.execute(
            `SELECT 
                otp,
                expire_at,
                use_at,
                created_at,
                CASE 
                    WHEN use_at IS NOT NULL THEN 'used'
                    WHEN expire_at <= NOW() THEN 'expired'
                    ELSE 'active'
                END as status
             FROM password_reset 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [userId]
        );

        return rows[0] || null;
    }

    // ===== RESEND OTP =====
    static async resend(email, expiresInMinutes = 10) {
        const [userRows] = await pool.execute(
            'SELECT User_id, name, surname FROM user WHERE email = ?',
            [email]
        );

        if (userRows.length === 0) {
            return null;
        }

        const user = userRows[0];
        const userId = user.User_id;
        const fullName = `${user.name} ${user.surname}`;

        // Generate new OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Create new OTP
        await this.create(userId, email, otpCode, expiresInMinutes);

        return {
            userId,
            email,
            fullName,
            otpCode
        };
    }

    // ===== CLEANUP OLD OTPS (Run as a scheduled job) =====
    static async cleanup() {
        const deleted = await this.deleteExpired();
        console.log(`🧹 Cleaned up ${deleted} expired OTPs`);
        return deleted;
    }
}

module.exports = OTP;