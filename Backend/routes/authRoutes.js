// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validation');
const svgCaptcha = require('svg-captcha');

// ============================================
// AUTH ROUTES
// ============================================

// 1. Signup - Creates new user account
router.post('/signup', validateSignup, AuthController.signup);

// 2. Login - Authenticates user
router.post('/login', validateLogin, AuthController.login);

// 3. Refresh Token - Get new access token
router.post('/refresh-token', AuthController.refreshToken);

// 4. Logout - Logs out user
router.post('/logout', AuthController.logout);

// ===== OTP ROUTES =====
// Long names (recommended)
router.post('/send-registration-otp', AuthController.sendRegistrationOTP);
router.post('/verify-registration-otp', AuthController.verifyRegistrationOTP);
router.post('/resend-registration-otp', AuthController.resendRegistrationOTP);

// Short names (for frontend compatibility)
router.post('/send-otp', AuthController.sendRegistrationOTP);
router.post('/verify-otp', AuthController.verifyRegistrationOTP);
router.post('/resend-otp', AuthController.resendRegistrationOTP);

// ===== PASSWORD RESET ROUTES =====
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-password-reset-otp', AuthController.verifyPasswordResetOTP);
router.post('/reset-password', AuthController.resetPassword);
router.post('/resend-password-reset-otp', AuthController.resendPasswordResetOTP);

// ===== GOOGLE OAUTH =====
router.post('/google-auth', AuthController.googleAuth);

// ===== HELPER ROUTES =====
router.get('/genders', AuthController.getGenders);
router.get('/roles', AuthController.getRoles);

// ============================================
// ✅ CAPTCHA ROUTES (Human Verification)
// ============================================

// Generate CAPTCHA image
router.get('/captcha', (req, res) => {
    try {
        const captcha = svgCaptcha.create({
            size: 6,
            ignoreChars: '0o1i',
            noise: 3,
            color: true,
            background: '#f0f0f0',
            width: 200,
            height: 60
        });

        // Store captcha in session
        req.session.captcha = captcha.text.toLowerCase();
        req.session.captchaExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        console.log('🔐 CAPTCHA generated:', captcha.text);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(captcha.data);
    } catch (error) {
        console.error('CAPTCHA generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate CAPTCHA' });
    }
});

// Refresh CAPTCHA
router.get('/captcha/refresh', (req, res) => {
    try {
        const captcha = svgCaptcha.create({
            size: 6,
            ignoreChars: '0o1i',
            noise: 3,
            color: true,
            background: '#f0f0f0',
            width: 200,
            height: 60
        });

        req.session.captcha = captcha.text.toLowerCase();
        req.session.captchaExpiry = Date.now() + 5 * 60 * 1000;

        res.json({
            success: true,
            data: captcha.data
        });
    } catch (error) {
        console.error('CAPTCHA refresh error:', error);
        res.status(500).json({ success: false, message: 'Failed to refresh CAPTCHA' });
    }
});

// Verify CAPTCHA (for standalone verification)
router.post('/verify-captcha', (req, res) => {
    try {
        const { captcha } = req.body;

        if (!captcha) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA is required'
            });
        }

        if (!req.session.captcha) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA not generated. Please refresh.'
            });
        }

        if (req.session.captchaExpiry && Date.now() > req.session.captchaExpiry) {
            req.session.captcha = null;
            req.session.captchaExpiry = null;
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA has expired. Please refresh.'
            });
        }

        const isValid = captcha.toLowerCase() === req.session.captcha;

        // Clear CAPTCHA after verification (one-time use)
        req.session.captcha = null;
        req.session.captchaExpiry = null;

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid CAPTCHA. Please try again.'
            });
        }

        res.json({
            success: true,
            message: 'CAPTCHA verified successfully'
        });

    } catch (error) {
        console.error(' CAPTCHA verification error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify CAPTCHA' });
    }
});

// Login with CAPTCHA verification
router.post('/login-with-captcha', async (req, res) => {
    try {
        const { email, password, captcha } = req.body;

        // Validate CAPTCHA
        if (!captcha) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA is required'
            });
        }

        // Check CAPTCHA in session
        if (!req.session.captcha) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA not generated. Please refresh.'
            });
        }

        if (req.session.captchaExpiry && Date.now() > req.session.captchaExpiry) {
            req.session.captcha = null;
            req.session.captchaExpiry = null;
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA has expired. Please refresh.'
            });
        }

        const isValid = captcha.toLowerCase() === req.session.captcha;

        // Clear CAPTCHA after verification
        req.session.captcha = null;
        req.session.captchaExpiry = null;

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid CAPTCHA. Please try again.'
            });
        }

        // Proceed with normal login
        await AuthController.login(req, res);

    } catch (error) {
        console.error('Login with CAPTCHA error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Auth Service',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;