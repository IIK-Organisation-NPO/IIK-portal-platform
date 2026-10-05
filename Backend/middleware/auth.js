// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');


const notFound = (res) =>
    res.status(404).json({
        status: 'error',
        message: 'Not found'
    });


const authenticate = async (req, res, next) => {
    try {
        
        const authHeader = req.headers.authorization;
        const headerToken =
            authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.split(' ')[1]
                : null;

        
        const cookieToken = req.cookies?.accessToken || null;

        const token = headerToken || cookieToken;

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided. Please log in.'
            });
        }

      
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token expired. Please log in again.'
                });
            }
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token. Please log in again.'
            });
        }

        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token payload.'
            });
        }

        
        const claimedType = String(decoded.userType || 'user').toLowerCase();

        
        if (claimedType === 'admin') {
            const [admins] = await pool.execute(
                `SELECT Admin_ID, Name, Surname, Email_address, role_ID, Centre_ID
                 FROM Admin
                 WHERE Admin_ID = ?
                 LIMIT 1`,
                [userId]
            );

            if (admins.length === 0) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Account not found. Please log in again.'
                });
            }

            const admin = admins[0];

            
            if (admin.role_ID !== 1 && admin.role_ID !== 3) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Account role is invalid. Please contact support.'
                });
            }

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
                roleId: admin.role_ID,
                centreId: admin.Centre_ID ?? null
            };

            return next();
        }

        
        const [users] = await pool.execute(
            `SELECT u.User_id, u.email, u.name, u.surname, u.role_id, r.role_type
             FROM user u
             LEFT JOIN role r ON u.role_id = r.role_id
             WHERE u.User_id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Account not found. Please log in again.'
            });
        }

        const user = users[0];

        
        if (user.role_id !== 2) {
            return res.status(401).json({
                status: 'error',
                message: 'Account role is invalid. Please contact support.'
            });
        }

        req.user = {
            userId: user.User_id,
            email: user.email,
            fullName: `${user.name} ${user.surname}`.trim(),
            userType: 'user',
            role: 'USER',
            roleId: 2,
            centreId: null
        };

        return next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed. Please log in.'
        });
    }
};



const getRoleInfo = (user) => {
    const roleId = Number(user?.roleId ?? 0);
    const userType = String(user?.userType || '').toLowerCase();
    const roleLabel = String(user?.role || '').toLowerCase();

    const isSuperAdmin =
        userType === 'admin' &&
        roleId === 3;

    const isAdmin =
        userType === 'admin' &&
        (roleId === 1 || roleId === 3);

    const isLearner =
        userType === 'user' &&
        roleId === 2;

    return { roleId, userType, roleLabel, isSuperAdmin, isAdmin, isLearner };
};

// ==========================================================
// Admin guard
// ==========================================================
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in first'
        });
    }

    const { isAdmin: allowed } = getRoleInfo(req.user);
    if (!allowed) return notFound(res);

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

    const { isLearner: allowed } = getRoleInfo(req.user);
    if (!allowed) return notFound(res);

    next();
};

// ==========================================================
// Super Admin guard 
// ==========================================================
const isSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in first'
        });
    }

    const { isSuperAdmin: allowed } = getRoleInfo(req.user);
    if (!allowed) return notFound(res);

    next();
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in first'
        });
    }

    const info = getRoleInfo(req.user);

    const allowed = roles.some((role) => {
        const r = String(role).toLowerCase();
        if (r === 'learner' || r === 'user') return info.isLearner;
        if (r === 'admin') return info.isAdmin;
        if (r === 'superadmin' || r === 'super_admin' || r === 'super admin') return info.isSuperAdmin;
        return false;
    });

    if (!allowed) return notFound(res);

    next();
};

module.exports = {
    authenticate,
    isAdmin,
    isLearner,
    isSuperAdmin,
    requireRole,
    getRoleInfo
};