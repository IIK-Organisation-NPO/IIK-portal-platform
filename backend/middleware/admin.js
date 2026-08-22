
const adminMiddleware = (req, res, next) => {
    try {
        // Get user from request (set by authMiddleware)
        const user = req.user;
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required. Please login first.'
            });
        }
        
        // Check if user is admin
        if (user.userType !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        // User is admin, proceed
        next();
        
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};

module.exports = adminMiddleware;