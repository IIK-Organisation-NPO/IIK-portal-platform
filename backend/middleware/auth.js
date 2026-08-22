// backend/middleware/auth.js
const jwt = require('jsonwebtoken');


const authMiddleware = (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        // 2. Check if header exists
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided. Please login first.'
            });
        }
        
        // 3. Check if it's a Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token format. Use: Bearer <your_token>'
            });
        }
        
        // 4. Extract the token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];
        
        // 5. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 6. Attach user data to request object
        // ✅ Check if it's an admin or learner
        if (decoded.userType === 'admin') {
            // Admin user
            req.user = {
                userId: decoded.adminId,
                email: decoded.email,
                centerName: decoded.centerName,
                userType: 'admin'
            };
        } else {
            // Learner user
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                fullName: decoded.fullName,
                gender: decoded.gender,
                userType: decoded.userType || 'learner',
                role: decoded.role || 'learner'
            };
        }
        
        // 7. Proceed to the next middleware/route handler
        next();
        
    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired. Please login again.'
            });
        }
        
        // Handle other errors
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Authentication failed. Please login again.'
        });
    }
};

module.exports = authMiddleware;