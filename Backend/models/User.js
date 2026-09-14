// backend/models/User.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // ===== CREATE USER =====
    static async create(userData) {
        const {
            name,
            surname,
            email,
            phone_number,
            gender_id,
            id_number,
            password,
            terms_accepted,
            role_id = 2
        } = userData;

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO user (
                name,
                surname,
                email,
                password_hash,
                id_number,
                phone_number,
                gender_id,
                terms_accepted,
                role_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            name,
            surname,
            email,
            password_hash,
            id_number,
            phone_number || null,
            gender_id || null,
            terms_accepted ? 1 : 0,
            role_id
        ]);

        return {
            user_id: result.insertId,
            name,
            surname,
            email,
            phone_number,
            gender_id,
            id_number
        };
    }

    // ===== FIND BY EMAIL =====
    static async findByEmail(email) {
        const query = `
            SELECT u.*, g.gender_description, r.role_type 
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.email = ?
        `;
        const [rows] = await pool.execute(query, [email.toLowerCase()]);
        return rows[0] || null;
    }

    // ===== FIND BY ID NUMBER =====
    static async findByIdNumber(idNumber) {
        const query = `
            SELECT u.*, g.gender_description, r.role_type 
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.id_number = ?
        `;
        const [rows] = await pool.execute(query, [idNumber]);
        return rows[0] || null;
    }

    // ===== FIND BY USER ID =====
    static async findById(userId) {
        const query = `
            SELECT u.*, g.gender_description, r.role_type 
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.User_id = ?
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows[0] || null;
    }

    // ===== UPDATE USER =====
    static async update(userId, updateData) {
        const fields = [];
        const values = [];

        const allowedFields = ['name', 'surname', 'phone_number', 'gender_id'];
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updateData[field]);
            }
        }

        if (fields.length === 0) return false;

        values.push(userId);
        const query = `UPDATE user SET ${fields.join(', ')} WHERE User_id = ?`;
        
        const [result] = await pool.execute(query, values);
        return result.affectedRows > 0;
    }

    // ===== UPDATE PASSWORD =====
    static async updatePassword(userId, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);
        
        const query = 'UPDATE user SET password_hash = ? WHERE User_id = ?';
        const [result] = await pool.execute(query, [password_hash, userId]);
        return result.affectedRows > 0;
    }

    // ===== VERIFY EMAIL =====
    static async verifyEmail(userId) {
        const query = 'UPDATE user SET email_verify = TRUE WHERE User_id = ?';
        const [result] = await pool.execute(query, [userId]);
        return result.affectedRows > 0;
    }

    // ===== VERIFY PASSWORD =====
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // ===== GET FULL USER PROFILE =====
    static async getFullProfile(userId) {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.id_number,
                u.phone_number,
                u.terms_accepted,
                u.email_verify,
                u.register_at,
                g.gender_description,
                g.gender_id,
                r.role_type,
                r.role_id
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.User_id = ?
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows[0] || null;
    }

    // ===== GET ALL USERS (Admin) =====
    static async getAllUsers(limit = 100, offset = 0) {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.id_number,
                u.phone_number,
                u.email_verify,
                u.register_at,
                g.gender_description,
                r.role_type
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            ORDER BY u.register_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await pool.execute(query, [limit, offset]);
        return rows;
    }

    // ===== COUNT TOTAL USERS =====
    static async countUsers() {
        const query = 'SELECT COUNT(*) as total FROM user';
        const [rows] = await pool.execute(query);
        return rows[0]?.total || 0;
    }

    // ===== SEARCH USERS =====
    static async searchUsers(searchTerm) {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.id_number,
                u.phone_number,
                u.email_verify,
                u.register_at,
                g.gender_description,
                r.role_type
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.name LIKE ? 
               OR u.surname LIKE ? 
               OR u.email LIKE ? 
               OR u.id_number LIKE ?
            ORDER BY u.register_at DESC
        `;
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await pool.execute(query, [searchPattern, searchPattern, searchPattern, searchPattern]);
        return rows;
    }

    // ===== DELETE USER =====
    static async deleteUser(userId) {
        const query = 'DELETE FROM user WHERE User_id = ?';
        const [result] = await pool.execute(query, [userId]);
        return result.affectedRows > 0;
    }

    // ===== GET USERS BY ROLE =====
    static async getUsersByRole(roleId) {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.id_number,
                u.phone_number,
                u.email_verify,
                u.register_at,
                g.gender_description,
                r.role_type
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.role_id = ?
            ORDER BY u.register_at DESC
        `;
        const [rows] = await pool.execute(query, [roleId]);
        return rows;
    }

    // ===== GET RECENT USERS =====
    static async getRecentUsers(limit = 10) {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.register_at,
                u.email_verify,
                r.role_type
            FROM user u
            LEFT JOIN role r ON u.role_id = r.role_id
            ORDER BY u.register_at DESC
            LIMIT ?
        `;
        const [rows] = await pool.execute(query, [limit]);
        return rows;
    }

    // ===== UPDATE LAST LOGIN =====
    static async updateLastLogin(userId) {
        //  Add last_login column if it doesn't exist
        try {
            const query = 'UPDATE user SET last_login_at = NOW() WHERE User_id = ?';
            await pool.execute(query, [userId]);
            return true;
        } catch (error) {
            // If column doesn't exist, just log
            console.log(` User ${userId} logged in (last_login tracking not available)`);
            return true;
        }
    }

    // ===== CHECK EMAIL EXISTS =====
    static async emailExists(email) {
        const query = 'SELECT COUNT(*) as count FROM user WHERE email = ?';
        const [rows] = await pool.execute(query, [email.toLowerCase()]);
        return rows[0].count > 0;
    }

    // ===== CHECK ID NUMBER EXISTS =====
    static async idNumberExists(idNumber) {
        const query = 'SELECT COUNT(*) as count FROM user WHERE id_number = ?';
        const [rows] = await pool.execute(query, [idNumber]);
        return rows[0].count > 0;
    }

    // ===== GET USER BY EMAIL WITH PASSWORD =====
    static async findByEmailWithPassword(email) {
        const query = `
            SELECT u.*, g.gender_description, r.role_type 
            FROM user u
            LEFT JOIN gender g ON u.gender_id = g.gender_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.email = ?
        `;
        const [rows] = await pool.execute(query, [email.toLowerCase()]);
        return rows[0] || null;
    }

    // ===== GET VERIFIED USERS =====
    static async getVerifiedUsers() {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.register_at
            FROM user u
            WHERE u.email_verify = TRUE
            ORDER BY u.register_at DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    // ===== GET UNVERIFIED USERS =====
    static async getUnverifiedUsers() {
        const query = `
            SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.register_at
            FROM user u
            WHERE u.email_verify = FALSE
            ORDER BY u.register_at DESC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    }

    // ===== GET USER STATS =====
    static async getUserStats() {
        const query = `
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN email_verify = TRUE THEN 1 ELSE 0 END) as verifiedUsers,
                SUM(CASE WHEN email_verify = FALSE THEN 1 ELSE 0 END) as unverifiedUsers,
                COUNT(DISTINCT role_id) as totalRoles
            FROM user
        `;
        const [rows] = await pool.execute(query);
        return rows[0];
    }
}

module.exports = User;