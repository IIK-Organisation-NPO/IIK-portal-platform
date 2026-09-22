// backend/controllers/staffController.js
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const User = require('../models/User');

// ============================================
// IN-MEMORY DEACTIVATION FLAG
// Tracks which staff IDs are currently deactivated.
// Resets on server restart — see notes at the bottom.
// ============================================
const deactivatedStaff = new Set();

// ============================================
//  GET ASSIGNABLE ROLES (only Administrator and Super Admin)
//  GET /api/staff/roles
// ============================================
exports.getAssignableRoles = async (req, res) => {
    try {
        const { pool } = require('../config/database');

        const [rows] = await pool.execute(
            `SELECT role_id, role_type
             FROM role
             WHERE role_id IN (1, 3)
             ORDER BY role_id ASC`
        );

        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Get assignable roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch roles'
        });
    }
};

// ============================================
//  CREATE STAFF (register a new admin user)
// ============================================
exports.createStaff = async (req, res) => {
    try {
        // 1. Check validator results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }

        const { name, surname, email, phone_number, role_id, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // 2. Reject duplicate email — check BOTH tables
        const existingAdmin = await Admin.findByEmail(normalizedEmail);
        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: 'A staff member with this email already exists',
                errors: [{
                    field: 'email',
                    message: 'This email is already registered as staff'
                }]
            });
        }

        // Also make sure it isn't already a learner account
        const existingLearner = await User.findByEmail(normalizedEmail);
        if (existingLearner) {
            return res.status(409).json({
                success: false,
                message: 'This email is already registered as a learner',
                errors: [{
                    field: 'email',
                    message: 'This email is already in use by a learner account'
                }]
            });
        }

        // 3. Normalize the phone before storing:
        //    +27XXXXXXXXX  -> 0XXXXXXXXX
        //    27XXXXXXXXX   -> 0XXXXXXXXX
        let normalizedPhone = null;
        if (phone_number) {
            let cleaned = String(phone_number).replace(/[\s\-()]/g, '');
            if (cleaned.startsWith('+27')) cleaned = '0' + cleaned.slice(3);
            else if (cleaned.startsWith('27')) cleaned = '0' + cleaned.slice(2);
            normalizedPhone = cleaned.replace(/\D/g, '');
        }

        // 4. Create the staff member (password is hashed in the model)
        const staff = await Admin.create({
            name,
            surname,
            email: normalizedEmail,
            phoneNumber: normalizedPhone,
            password,
            roleId: parseInt(role_id, 10)
        });

        return res.status(201).json({
            success: true,
            message: 'Staff member registered successfully.',
            data: {
                id: staff.admin_id,
                name: staff.name,
                surname: staff.surname,
                email: staff.email,
                phone_number: staff.phone_number,
                role_id: staff.role_id
            }
        });
    } catch (error) {
        console.error('Create staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};
// ============================================
//  DELETE STAFF (hard delete from the Admin table)
//  DELETE /api/staff/:id
// ============================================
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { pool } = require('../config/database');

        // Don't allow deleting yourself (optional but recommended)
        const sessionAdminId =
            req.session?.adminId ||
            req.session?.admin?.Admin_ID ||
            req.session?.Admin_ID ||
            null;

        if (sessionAdminId && String(sessionAdminId) === String(id)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account.',
            });
        }

        // Confirm the row exists first
        const [rows] = await pool.execute(
            'SELECT Admin_ID, Name, Surname FROM Admin WHERE Admin_ID = ? LIMIT 1',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found.',
            });
        }

        // Try to delete. If the FK from other tables blocks it,
        // we catch that specific error and give a friendly message.
        try {
            await pool.execute('DELETE FROM Admin WHERE Admin_ID = ?', [id]);
        } catch (fkErr) {
            // MySQL error code for FK constraint
            if (fkErr.code === 'ER_ROW_IS_REFERENCED_2' || fkErr.errno === 1451) {
                return res.status(409).json({
                    success: false,
                    message:
                        'Cannot delete this staff member because they have related records (e.g. blog posts). Deactivate them instead.',
                });
            }
            throw fkErr;
        }

        return res.status(200).json({
            success: true,
            message: 'Staff member deleted successfully.',
        });
    } catch (error) {
        console.error('Delete staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete staff member. Please try again later.',
        });
    }
};
// ============================================
//  GET MY PROFILE (logged-in admin)
//  GET /api/staff/me
// ============================================
exports.getMyAdminProfile = async (req, res) => {
    try {
        // Read the admin id from whatever key the auth middleware used.
        // Different middleware implementations set different keys.
        const adminId =
            req.user?.userId     ??
            req.user?.id         ??
            req.user?.Admin_ID   ??
            req.user?.adminId    ??
            req.session?.adminId ??
            req.session?.admin?.Admin_ID ??
            null;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const admin = await Admin.getById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: admin.Admin_ID,
                name: admin.Name,
                surname: admin.Surname,
                email: admin.Email_address,
                phone_number: admin.Phone_number,
                role_id: admin.role_ID,
                role_type: admin.role_type || 'ADMIN'
            }
        });
    } catch (error) {
        console.error('Get my admin profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

// ============================================
//  UPDATE MY PROFILE (name + surname only)
//  PUT /api/staff/me
// ============================================
exports.updateMyAdminProfile = async (req, res) => {
    try {
        const adminId =
            req.user?.userId     ??
            req.user?.id         ??
            req.user?.Admin_ID   ??
            req.user?.adminId    ??
            req.session?.adminId ??
            req.session?.admin?.Admin_ID ??
            null;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { name, surname } = req.body;

        // ---- Validate each field the same way as createStaff ----
        const validateName = (value, label) => {
            const v = (value || '').trim();
            if (!v) return `${label} is required`;
            if (v.length < 2) return `${label} must be at least 2 characters`;
            if (v.length > 50) return `${label} must be less than 50 characters`;
            if (/\d/.test(v)) return `${label} cannot contain numbers`;
            if (!/^[A-Za-z\s\-']+$/.test(v)) {
                return `${label} can only contain letters, spaces, hyphens, and apostrophes`;
            }
            return '';
        };

        const errors = [];
        const nameErr = validateName(name, 'Name');
        const surnameErr = validateName(surname, 'Surname');

        if (nameErr) errors.push({ field: 'name', message: nameErr });
        if (surnameErr) errors.push({ field: 'surname', message: surnameErr });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        await Admin.update(adminId, {
            name: name.trim(),
            surname: surname.trim()
        });

        const updated = await Admin.getById(adminId);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: updated.Admin_ID,
                name: updated.Name,
                surname: updated.Surname,
                email: updated.Email_address,
                role_id: updated.role_ID,
                role_type: updated.role_type || 'ADMIN'
            }
        });
    } catch (error) {
        console.error('Update my admin profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};
// ============================================
//  CHANGE MY PASSWORD
//  PUT /api/staff/me/password
//  Body: { currentPassword, newPassword, confirmPassword }
// ============================================
exports.changeMyPassword = async (req, res) => {
    try {
        const adminId = req.user?.userId;
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        // ---- Validate ----
        const errors = [];

        if (!currentPassword) {
            errors.push({ field: 'currentPassword', message: 'Current password is required' });
        }
        if (!newPassword) {
            errors.push({ field: 'newPassword', message: 'New password is required' });
        }
        if (!confirmPassword) {
            errors.push({ field: 'confirmPassword', message: 'Please confirm your new password' });
        }

        if (errors.length === 0) {
            if (newPassword.length < 8) {
                errors.push({ field: 'newPassword', message: 'Password must be at least 8 characters' });
            } else if (newPassword.length > 50) {
                errors.push({ field: 'newPassword', message: 'Password must be less than 50 characters' });
            } else if (!/(?=.*[a-z])/.test(newPassword)) {
                errors.push({ field: 'newPassword', message: 'Password must contain at least one lowercase letter' });
            } else if (!/(?=.*[A-Z])/.test(newPassword)) {
                errors.push({ field: 'newPassword', message: 'Password must contain at least one uppercase letter' });
            } else if (!/(?=.*\d)/.test(newPassword)) {
                errors.push({ field: 'newPassword', message: 'Password must contain at least one number' });
            } else if (!/(?=.*[@$!%*?&])/.test(newPassword)) {
                errors.push({ field: 'newPassword', message: 'Password must contain at least one special character (@$!%*?&)' });
            }

            if (newPassword !== confirmPassword) {
                errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
            }

            if (newPassword === currentPassword) {
                errors.push({ field: 'newPassword', message: 'New password must be different from the current password' });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // ---- Fetch admin row WITH password ----
        const admin = await Admin.getByIdWithPassword(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        // ---- Verify current password ----
        const bcrypt = require('bcryptjs');
        const matches = await bcrypt.compare(currentPassword, admin.Password);
        if (!matches) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
                errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }]
            });
        }

        // ---- Save the new password ----
        await Admin.updatePassword(adminId, newPassword);

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Change my password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

// ============================================
//  LIST STAFF (for the table)
// Merges the in-memory deactivation flag into each row so the
// frontend receives an Is_active value without needing a DB column.
// ============================================
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Admin.getAll();

        const data = staff.map((row) => ({
            ...row,
            Is_active: deactivatedStaff.has(String(row.Admin_ID)) ? 0 : 1
        }));

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch staff members'
        });
    }
};

// ============================================
//  UPDATE STAFF STATUS (activate / deactivate)
// PATCH /api/staff/:id/status
// Body: { is_active: true | false }
// Uses the in-memory Set — no DB column required.
// ============================================
exports.updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value. Expected true or false.'
            });
        }

        // Verify the row exists so we can return a clean 404
        const existing = await Admin.getById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found.'
            });
        }

        if (is_active) {
            deactivatedStaff.delete(String(id));
        } else {
            deactivatedStaff.add(String(id));
        }

        return res.status(200).json({
            success: true,
            message: is_active
                ? 'Staff member activated successfully.'
                : 'Staff member deactivated successfully.'
        });
    } catch (error) {
        console.error('Update staff status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};