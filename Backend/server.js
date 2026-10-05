// backend/server.js
const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/uploadRoutes');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const learnerRoutes = require('./routes/learnerRoutes');
const programmeRoutes = require('./routes/programmeRoutes');
const { pool } = require('./config/database');
const staffRoutes = require('./routes/staffRoutes');
const blogRoutes = require('./routes/BlogRoutes');
const navigationRoutes = require('./routes/navigationRoutes');
const { startWeeklySummaryJob } = require('./weeklySummary/weeklySummary');
const app = express();
app.set('trust proxy', 1);

// ===== ALLOWED ORIGINS (from .env) =====
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// ===== SESSION CONFIGURATION =====
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'lax'
    },
    name: 'sessionId'
}));

// ===== CORS CONFIGURATION (must come BEFORE routes) =====
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Cookie'
    ]
}));

// Handle preflight requests
app.options('*', cors());

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== LOGGING MIDDLEWARE =====
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    console.log(`   Session ID: ${req.sessionID || 'No session'}`);
    console.log(`   Session Data:`, req.session || {});
    next();
});

// ===== SECURITY HEADERS MIDDLEWARE =====
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    const frameAncestors = ["'self'", ...allowedOrigins].join(' ');
    res.setHeader('Content-Security-Policy', `frame-ancestors ${frameAncestors};`);
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ===== RATE LIMITING =====
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100000,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ===== STATIC FILES =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== REGISTER ROUTES =====
console.log('Registering routes...');

app.use('/api', globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
console.log('Auth routes registered at /api/auth');

app.use('/api/admin', adminRoutes);
console.log('Admin routes registered at /api/admin');

app.use('/api/learner', learnerRoutes);
console.log('Learner routes registered at /api/learner');

app.use('/api', programmeRoutes);
console.log('Programme routes registered at /api/programmes');

app.use('/api', staffRoutes);

app.use('/api/blog', blogRoutes);
console.log('Blog routes registered at /api/blog');

app.use('/api/navigation', navigationRoutes);
console.log('Navigation routes registered at /api/navigation');

// Upload routes — moved here, AFTER CORS
app.use('/api/upload', uploadRoutes);
console.log('Upload routes registered at /api/upload');

// ===== TEST ROUTE =====
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        session: {
            id: req.sessionID,
            hasCaptcha: !!req.session.captcha
        },
        routes: {
            auth: '/api/auth',
            admin: '/api/admin',
            learner: '/api/learner',
            programmes: '/api/programmes',
            blog: '/api/blog',
            navigation: '/api/navigation',
            upload: '/api/upload'
        }
    });
});

// ===== SESSION TEST ROUTE =====
app.get('/api/session-test', (req, res) => {
    if (!req.session.testCount) {
        req.session.testCount = 1;
    } else {
        req.session.testCount++;
    }

    res.json({
        success: true,
        sessionId: req.sessionID,
        testCount: req.session.testCount,
        sessionData: req.session
    });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    console.log(`404: ${req.method} ${req.originalUrl} - Route not found`);
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

const PORT = process.env.PORT || 5000;
const SERVER_BASE = process.env.API_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log(`API URL: ${SERVER_BASE}/api`);
    console.log(`Auth routes: ${SERVER_BASE}/api/auth`);
    console.log(`Admin routes: ${SERVER_BASE}/api/admin`);
    console.log(`Learner routes: ${SERVER_BASE}/api/learner`);
    console.log(`Programme routes: ${SERVER_BASE}/api/programmes`);
    console.log(`Blog routes: ${SERVER_BASE}/api/blog`);
    console.log(`Navigation routes: ${SERVER_BASE}/api/navigation`);
    console.log(`Upload routes: ${SERVER_BASE}/api/upload`);
    console.log(`Test route: ${SERVER_BASE}/api/test`);
    console.log(`\nSecurity Features Enabled:`);
    console.log(`   - HTTP-only cookies ready`);
    console.log(`   - Session management enabled (for CAPTCHA)`);
    console.log(`   - Rate limiting active`);
    console.log(`   - Security headers set`);
    console.log(`   - CORS configured for credentials`);
    console.log(`   - CAPTCHA ready for human verification`);
    console.log(`   - X-Frame-Options: SAMEORIGIN (allows PDF iframes)\n`);
    // Start background jobs
    startWeeklySummaryJob();
});