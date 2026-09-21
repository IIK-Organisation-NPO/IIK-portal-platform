// backend/models/Admin.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
    // ==========================================================
    // CREATE a new staff member in the Admin table
    // ==========================================================
    static async create({ name, surname, email, phoneNumber, password, roleId = 1 }) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO Admin
                (role_ID, Name, Surname, Email_address, Phone_number, Password)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(query, [
            roleId,
            name.trim(),
            surname.trim(),
            email.toLowerCase().trim(),
            phoneNumber || null,
            passwordHash
        ]);

        return {
            admin_id: result.insertId,
            name: name.trim(),
            surname: surname.trim(),
            email: email.toLowerCase().trim(),
            phone_number: phoneNumber || null,
            role_id: roleId
        };
    }

    // ==========================================================
    // FIND BY EMAIL (used for duplicate checks)
    // ==========================================================
    static async findByEmail(email) {
        const query = 'SELECT * FROM Admin WHERE Email_address = ?';
        const [rows] = await pool.execute(query, [email.toLowerCase().trim()]);
        return rows[0] || null;
    }

    // ==========================================================
    // FIND BY ID (used by the status update endpoint)
    // ==========================================================
    static async getById(id) {
        const query = `
            SELECT a.Admin_ID, a.Name, a.Surname, a.Email_address,
                   a.Phone_number, a.role_ID, r.role_type
            FROM Admin a
            LEFT JOIN role r ON a.role_ID = r.role_id
            WHERE a.Admin_ID = ?
        `;
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // ==========================================================
    // GET ALL STAFF (for the table)
    // Pulls created_at / last_login_at / Is_active if those
    // columns exist, silently falls back otherwise.
    // ==========================================================
    static async getAll() {
        const [createdCols] = await pool.query(
            "SHOW COLUMNS FROM Admin LIKE 'created_at'"
        );
        const [lastLoginCols] = await pool.query(
            "SHOW COLUMNS FROM Admin LIKE 'last_login_at'"
        );
        const [isActiveCols] = await pool.query(
            "SHOW COLUMNS FROM Admin LIKE 'Is_active'"
        );

        const createdSelect   = createdCols.length > 0   ? 'a.created_at'    : 'NULL AS created_at';
        const lastLoginSelect = lastLoginCols.length > 0 ? 'a.last_login_at' : 'NULL AS last_login_at';
        const isActiveSelect  = isActiveCols.length > 0  ? 'a.Is_active'     : '1 AS Is_active';

        const query = `
            SELECT
                a.Admin_ID,
                a.Name,
                a.Surname,
                a.Email_address,
                a.Phone_number,
                a.role_ID,
                r.role_type,
                ${createdSelect},
                ${lastLoginSelect},
                ${isActiveSelect}
            FROM Admin a
            LEFT JOIN role r ON a.role_ID = r.role_id
            ORDER BY a.Admin_ID DESC
        `;

        const [rows] = await pool.execute(query);
        return rows;
    }

    // ==========================================================
    // UPDATE STATUS (Activate / Deactivate)
    // Only runs if the Is_active column exists.
    // ==========================================================
    static async updateStatus(id, isActive) {
        const [cols] = await pool.query(
            "SHOW COLUMNS FROM Admin LIKE 'Is_active'"
        );
        if (cols.length === 0) {
            return false;
        }

        const query = 'UPDATE Admin SET Is_active = ? WHERE Admin_ID = ?';
        const [result] = await pool.execute(query, [isActive ? 1 : 0, id]);
        return result.affectedRows > 0;
    }

    // ==========================================================
    // UPDATE LAST LOGIN TIMESTAMP
    // Only runs if the last_login_at column exists.
    // ==========================================================
    static async updateLastLogin(id) {
        const [cols] = await pool.query(
            "SHOW COLUMNS FROM Admin LIKE 'last_login_at'"
        );
        if (cols.length === 0) return false;

        const query = 'UPDATE Admin SET last_login_at = NOW() WHERE Admin_ID = ?';
        await pool.execute(query, [id]);
        return true;
    }

    // ==========================================================
    // DELETE STAFF
    // ==========================================================
    static async delete(id) {
        const [result] = await pool.execute(
            'DELETE FROM Admin WHERE Admin_ID = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
        // ==========================================================
    // GET BY ID — includes hashed password (for password change)
    // ==========================================================
    static async getByIdWithPassword(id) {
        const query = 'SELECT * FROM Admin WHERE Admin_ID = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0] || null;
    }

    // ==========================================================
    // UPDATE PROFILE (name / surname only — email is immutable)
    // ==========================================================
    static async update(id, data) {
        const { name, surname } = data;

        const fields = [];
        const values = [];

        if (name !== undefined && name !== null) {
            fields.push('Name = ?');
            values.push(name.trim());
        }
        if (surname !== undefined && surname !== null) {
            fields.push('Surname = ?');
            values.push(surname.trim());
        }

        if (fields.length === 0) return false;

        values.push(id);

        const [result] = await pool.execute(
            `UPDATE Admin SET ${fields.join(', ')} WHERE Admin_ID = ?`,
            values
        );
        return result.affectedRows > 0;
    }

    // ==========================================================
    // UPDATE PASSWORD (hashes before storing)
    // ==========================================================
    static async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const [result] = await pool.execute(
            'UPDATE Admin SET Password = ? WHERE Admin_ID = ?',
            [passwordHash, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Admin;
