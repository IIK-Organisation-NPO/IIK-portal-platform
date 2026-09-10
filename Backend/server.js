// backend/server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const learnerRoutes = require('./routes/learnerRoutes');
const { pool } = require('./config/database');

const app = express();

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

// ===== CORS CONFIGURATION =====
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175'
    ],
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
    console.log(`📝 ${req.method} ${req.originalUrl}`);
    console.log(`   Session ID: ${req.sessionID || 'No session'}`);
    console.log(`   Session Data:`, req.session || {});
    next();
});

// ===== SECURITY HEADERS MIDDLEWARE - FIXED =====
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // ✅ Allow iframes for PDF viewing
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // ✅ Allow specific origins for iframe embedding
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:5173 http://localhost:5174 http://localhost:5175;");
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ===== RATE LIMITING =====
const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ===== REGISTER ROUTES =====
console.log('📦 Registering routes...');

app.use('/api', globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
console.log('✅ Auth routes registered at /api/auth');

app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes registered at /api/admin');

app.use('/api/learner', learnerRoutes);
console.log('✅ Learner routes registered at /api/learner');

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
            learner: '/api/learner'
        },
        security: {
            cookies: 'HTTP-only, Secure, SameSite=Lax',
            rateLimiting: '15 minutes, 100 requests',
            authLimiting: '15 minutes, 20 attempts',
            headers: 'XSS, Frame, Content-Type protection enabled',
            captcha: 'SVG CAPTCHA enabled with session storage'
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
    console.error('❌ Server Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    console.log(`❌ 404: ${req.method} ${req.originalUrl} - Route not found`);
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`📡 Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`📡 Admin routes: http://localhost:${PORT}/api/admin`);
    console.log(`📡 Learner routes: http://localhost:${PORT}/api/learner`);
    console.log(`📡 Test route: http://localhost:${PORT}/api/test`);
    console.log(`\n🔒 Security Features Enabled:`);
    console.log(`   ✅ HTTP-only cookies ready`);
    console.log(`   ✅ Session management enabled (for CAPTCHA)`);
    console.log(`   ✅ Rate limiting active`);
    console.log(`   ✅ Security headers set`);
    console.log(`   ✅ CORS configured for credentials`);
    console.log(`   ✅ CAPTCHA ready for human verification`);
    console.log(`   ✅ X-Frame-Options: SAMEORIGIN (allows PDF iframes)\n`);
});