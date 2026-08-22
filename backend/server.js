// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ✅ ADD THIS
const { testConnection } = require('./config/database');

// Initialize express
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Allow frontend ports
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// DATABASE CONNECTION
// ============================================
testConnection();

// ============================================
// ROUTES
// ============================================

// Auth routes
app.use('/api/auth', authRoutes);

// ✅ Admin routes
app.use('/api/admin', adminRoutes);

// ✅ Handle /verify-email redirect (for email links)
app.get('/verify-email', (req, res) => {
    const token = req.query.token;
    if (token) {
        console.log(`🔗 Redirecting verification: /verify-email?token=${token} -> /api/auth/verify/${token}`);
        res.redirect(`/api/auth/verify/${token}`);
    } else {
        res.status(400).json({
            status: 'error',
            message: 'Verification token is required'
        });
    }
});

// ✅ Handle /verify route (in case email uses this)
app.get('/verify', (req, res) => {
    const token = req.query.token;
    if (token) {
        console.log(`🔗 Redirecting verification: /verify?token=${token} -> /api/auth/verify/${token}`);
        res.redirect(`/api/auth/verify/${token}`);
    } else {
        res.status(400).json({
            status: 'error',
            message: 'Verification token is required'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route not found: ${req.originalUrl}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 http://localhost:${PORT}`);
    console.log(`✅ CORS enabled for frontend ports: 3000, 3001, 5173, 5174`);
    console.log(`✅ Verification redirects: /verify-email and /verify → /api/auth/verify/:token`);
    console.log(`✅ Admin routes: /api/admin`);
    console.log('='.repeat(50));
});