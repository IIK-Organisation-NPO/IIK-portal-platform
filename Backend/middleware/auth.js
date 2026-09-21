// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// ==========================================================
// Authenticate middleware
// Reads the JWT, checks the type of account (user or admin)
// and queries the correct table.
// ==========================================================
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided. Please log in.'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token format'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // userType comes from the JWT payload (set at login time).
        // Fallback to 'user' for backward compatibility with old tokens.
        const userType = (decoded.userType || 'user').toLowerCase();

        // ---- Admin branch ----
        if (userType === 'admin') {
            const [admins] = await pool.query(
                `SELECT a.Admin_ID, a.Name, a.Surname, a.Email_address,
                        a.role_ID, r.role_type
                 FROM Admin a
                 LEFT JOIN role r ON a.role_ID = r.role_id
                 WHERE a.Admin_ID = ?`,
                [decoded.userId || decoded.id]
            );

            if (admins.length === 0) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Admin account not found'
                });
            }

            const admin = admins[0];

            // role_ID 3 = Super Admin, everything else = ADMIN
            const role =
                admin.role_ID === 3 ? 'Super Admin' :
                admin.role_ID === 1 ? 'ADMIN' :
                'ADMIN';

            req.user = {
                userId: admin.Admin_ID,
                email: admin.Email_address,
                fullName: `${admin.Name} ${admin.Surname}`.trim(),
                userType: 'admin',
                role,
                roleId: admin.role_ID
            };

            return next();
        }

        // ---- Learner branch (default) ----
        const [users] = await pool.query(
            `SELECT u.User_id, u.email, u.name, u.surname, r.role_type
             FROM user u
             LEFT JOIN role r ON u.role_id = r.role_id
             WHERE u.User_id = ?`,
            [decoded.userId || decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const user = users[0];

        req.user = {
            userId: user.User_id,
            email: user.email,
            fullName: `${user.name} ${user.surname}`.trim(),
            userType: user.role_type ? user.role_type.toLowerCase() : 'user',
            role: user.role_type || 'USER'
        };

        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token. Please log in again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired. Please log in again.'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed. Please log in.'
        });
    }
};

// ==========================================================
// Admin guard
// Recognises both 'admin' userType and both admin role labels.
// ==========================================================
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in first'
        });
    }

    const isAdminUser =
        req.user.userType === 'admin' ||
        req.user.role === 'ADMIN' ||
        req.user.role === 'Super Admin';

    if (!isAdminUser) {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin privileges required.'
        });
    }

    next();
};

// ==========================================================
// Learner guard
// ==========================================================
const isLearner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in first'
        });
    }

    if (req.user.userType !== 'user' && req.user.userType !== 'learner') {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Learner privileges required.'
        });
    }

    next();
};

module.exports = {
    authenticate,
    isAdmin,
    isLearner
};