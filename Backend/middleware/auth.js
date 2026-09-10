// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Authenticate middleware
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
        
        console.log(' Decoded token:', decoded);
        
        // Get user from database using your 'user' table
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
        
        // Attach user to request
        req.user = {
            userId: user.User_id,
            email: user.email,
            fullName: user.name + ' ' + user.surname,
            userType: user.role_type ? user.role_type.toLowerCase() : 'user'
        };
        
        next();
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

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in first'
        });
    }
    
    if (req.user.userType !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Check if user is learner
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