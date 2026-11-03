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
router.post('/send-registration-otp', AuthController.sendRegistrationOTP);
router.post('/verify-registration-otp', AuthController.verifyRegistrationOTP);
router.post('/resend-registration-otp', AuthController.resendRegistrationOTP);
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
// ✅ CAPTCHA ROUTES (Stateless, no cookies)
//
// The answer is signed into a token rather than stored in the session.
// This means the CAPTCHA works even when the browser blocks the
// session cookie (incognito, third-party cookie blocking, Safari ITP).
// ============================================

const crypto = require('crypto');

// ---- CAPTCHA token config ----
const CAPTCHA_SECRET =
    process.env.CAPTCHA_SECRET ||
    process.env.JWT_SECRET ||
    'dev-captcha-secret-change-me';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;   // 5 minutes

// Create a signed token: <answer>|<issuedAt>|<hmac>
const signCaptchaToken = (answer) => {
    const issuedAt = Date.now();
    const payload = `${answer}|${issuedAt}`;
    const signature = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(payload)
        .digest('hex');
    return Buffer.from(`${payload}|${signature}`).toString('base64url');
};

// Verify a signed token. Returns { ok, reason?, answer? }
const verifyCaptchaToken = (token) => {
    if (!token || typeof token !== 'string') {
        return { ok: false, reason: 'CAPTCHA not generated. Please refresh.' };
    }

    let decoded;
    try {
        decoded = Buffer.from(token, 'base64url').toString('utf8');
    } catch {
        return { ok: false, reason: 'Invalid CAPTCHA token.' };
    }

    const parts = decoded.split('|');
    if (parts.length !== 3) {
        return { ok: false, reason: 'Invalid CAPTCHA token.' };
    }

    const [answer, issuedAtStr, signature] = parts;
    const issuedAt = Number(issuedAtStr);

    if (!answer || !issuedAt || isNaN(issuedAt)) {
        return { ok: false, reason: 'Invalid CAPTCHA token.' };
    }

    // 1. Signature check — nothing was tampered with
    const expected = crypto
        .createHmac('sha256', CAPTCHA_SECRET)
        .update(`${answer}|${issuedAt}`)
        .digest('hex');

    if (signature !== expected) {
        return { ok: false, reason: 'Invalid CAPTCHA token.' };
    }

    // 2. Expiry check
    if (Date.now() - issuedAt > CAPTCHA_TTL_MS) {
        return { ok: false, reason: 'CAPTCHA has expired. Please refresh.' };
    }

    return { ok: true, answer };
};

// Generate CAPTCHA image — returns the SVG plus a signed token
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

        const token = signCaptchaToken(captcha.text);

        console.log('🔐 CAPTCHA generated');

        res.json({
            success: true,
            data: captcha.data,         // SVG string
            token,                      // send this back on login
            expiresIn: CAPTCHA_TTL_MS
        });
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

        const token = signCaptchaToken(captcha.text);

        console.log('🔐 CAPTCHA refreshed');

        res.json({
            success: true,
            data: captcha.data,
            token,
            expiresIn: CAPTCHA_TTL_MS
        });
    } catch (error) {
        console.error('CAPTCHA refresh error:', error);
        res.status(500).json({ success: false, message: 'Failed to refresh CAPTCHA' });
    }
});

// Verify CAPTCHA (standalone)
router.post('/verify-captcha', (req, res) => {
    try {
        const { captcha, captchaToken } = req.body;

        if (!captcha) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA is required'
            });
        }

        const check = verifyCaptchaToken(captchaToken);
        if (!check.ok) {
            return res.status(400).json({
                success: false,
                message: check.reason
            });
        }

        // Case-sensitive comparison
        if (String(captcha) !== String(check.answer)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid CAPTCHA.'
            });
        }

        res.json({
            success: true,
            message: 'CAPTCHA verified successfully'
        });
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify CAPTCHA' });
    }
});

// Login with CAPTCHA verification
router.post('/login-with-captcha', async (req, res) => {
    try {
        const { email, password, captcha, captchaToken } = req.body;

        if (!captcha) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA is required'
            });
        }

        const check = verifyCaptchaToken(captchaToken);
        if (!check.ok) {
            return res.status(400).json({
                success: false,
                message: check.reason
            });
        }

        // Case-sensitive comparison
        if (String(captcha) !== String(check.answer)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid CAPTCHA.'
            });
        }

        // CAPTCHA passed — proceed with normal login
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