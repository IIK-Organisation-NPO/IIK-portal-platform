// backend/controllers/staffController.js
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { pool } = require('../config/database');
const { getPrefs: getAdminPrefs, setPrefs: setAdminPrefs } = require('../utils/adminNotificationPrefs');


const deactivatedStaff = new Set();
const resolveSessionAdminId = (req) =>
    req.user?.userId ??
    req.user?.id ??
    req.user?.Admin_ID ??
    req.user?.adminId ??
    req.session?.adminId ??
    req.session?.admin?.Admin_ID ??
    req.session?.Admin_ID ??
    null;


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
// Get all digital centres (for staff assignment)
// ============================================
exports.getDigitalCenters = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT digital_center_id, center_name FROM digital_center ORDER BY center_name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getDigitalCenters error:', err);
    res.status(500).json({ success: false, message: 'Failed to load digital centres.' });
  }
};
// ============================================
//  CREATE STAFF 
// ============================================
exports.createStaff = async (req, res) => {
    try {
       
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

        const { name, surname, email, phone_number, role_id, password, centre } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

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

        
        let normalizedPhone = null;
        if (phone_number) {
            let cleaned = String(phone_number).replace(/[\s\-()]/g, '');
            if (cleaned.startsWith('+27')) cleaned = '0' + cleaned.slice(3);
            else if (cleaned.startsWith('27')) cleaned = '0' + cleaned.slice(2);
            normalizedPhone = cleaned.replace(/\D/g, '');
        }

        
        const centreId = centre ? parseInt(centre, 10) : null;
        const staff = await Admin.create({
            name,
            surname,
            email: normalizedEmail,
            phoneNumber: normalizedPhone,
            password,
            roleId: parseInt(role_id, 10),
            centreId
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
                role_id: staff.role_id,
                centre_id: staff.centre_id
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
//  DELETE STAFF 
// ============================================
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { pool } = require('../config/database');
        const sessionAdminId = resolveSessionAdminId(req);

        if (sessionAdminId != null && String(sessionAdminId) === String(id)) {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete your own account.',
            });
        }

       
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

        
        try {
            await pool.execute('DELETE FROM Admin WHERE Admin_ID = ?', [id]);
        } catch (fkErr) {
            
            if (fkErr.code === 'ER_ROW_IS_REFERENCED_2' || fkErr.errno === 1451) {
                return res.status(409).json({
                    success: false,
                    message:
                        'Cannot delete this staff member because they have related records (e.g. blog posts). Deactivate them instead.',
                });
            }
            throw fkErr;
        }
        deactivatedStaff.delete(String(id));

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
//  GET MY PROFILE 
// ============================================
exports.getMyAdminProfile = async (req, res) => {
    try {
        const adminId = resolveSessionAdminId(req);

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
//  UPDATE MY PROFILE 
// ============================================
exports.updateMyAdminProfile = async (req, res) => {
    try {
        const adminId = resolveSessionAdminId(req);

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { name, surname } = req.body;

        
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
// ============================================
exports.changeMyPassword = async (req, res) => {
    try {
        const adminId = resolveSessionAdminId(req);
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        
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

        
        const admin = await Admin.getByIdWithPassword(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        
        const bcrypt = require('bcryptjs');
        const matches = await bcrypt.compare(currentPassword, admin.Password);
        if (!matches) {
           
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
                errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }]
            });
        }

        
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
//  LIST STAFF 
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
//  UPDATE STAFF STATUS 
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

       
        const sessionAdminId = resolveSessionAdminId(req);

        if (
            is_active === false &&
            sessionAdminId != null &&
            String(sessionAdminId) === String(id)
        ) {
            return res.status(403).json({
                success: false,
                message: 'You cannot deactivate your own account.'
            });
        }

        
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

// ============================================
//  VERIFY MY CURRENT PASSWORD.
// ============================================
exports.verifyMyPassword = async (req, res) => {
    try {
        const adminId = resolveSessionAdminId(req);

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const admin = await Admin.getByIdWithPassword(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin account not found'
            });
        }

        const bcrypt = require('bcryptjs');
        const matches = await bcrypt.compare(password, admin.Password);

        return res.status(200).json({
            success: true,
            valid: matches
        });
    } catch (error) {
        console.error('Verify password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};

// ============================================
//  GET MY NOTIFICATION PREFERENCES
// ============================================
exports.getMyNotificationPrefs = async (req, res) => {
    try {
        const adminId = resolveSessionAdminId(req);
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        return res.status(200).json({
            success: true,
            data: getAdminPrefs(adminId)
        });
    } catch (error) {
        console.error('Get admin notification prefs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load preferences: ' + error.message
        });
    }
};

// ============================================
//  UPDATE MY NOTIFICATION PREFERENCES
// ============================================
exports.updateMyNotificationPrefs = async (req, res) => {
    try {
        const adminId = resolveSessionAdminId(req);
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { notifyOnCertificate, notifyOnRegistration, notifyWeekly } = req.body;

        if (
            typeof notifyOnCertificate !== 'boolean' ||
            typeof notifyOnRegistration !== 'boolean' ||
            typeof notifyWeekly !== 'boolean'
        ) {
            return res.status(400).json({
                success: false,
                message: 'All three preferences must be booleans.'
            });
        }

        const ok = setAdminPrefs(adminId, {
            notifyOnCertificate,
            notifyOnRegistration,
            notifyWeekly,
        });

        if (!ok) {
            return res.status(500).json({
                success: false,
                message: 'Failed to save preferences.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Preferences saved successfully',
            data: getAdminPrefs(adminId)
        });
    } catch (error) {
        console.error('Update admin notification prefs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save preferences: ' + error.message
        });
    }
};