// backend/controllers/authController.js
const User = require('../models/User');
const Admin = require('../models/Admin');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const emailService = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

dotenv.config();

const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory staging for signups awaiting OTP verification.
// Cleared as soon as the OTP is verified, or after 30 minutes.
const pendingSignups = new Map();

// Sweep expired pending signups every 5 minutes
setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [email, entry] of pendingSignups.entries()) {
        if (entry.expire_at < now) {
            pendingSignups.delete(email);
            removed++;
        }
    }
    if (removed > 0) {
        console.log(`🧹 Cleaned up ${removed} expired pending signup(s)`);
    }
}, 5 * 60 * 1000);

// In-memory login attempt tracking
const loginAttempts = {};

// Lockout duration based on lockout count (progressive)
const getLockDuration = (lockoutCount) => {
    if (lockoutCount <= 1) return 1;
    if (lockoutCount === 2) return 3;
    return 5;
};

// Get lockout description
const getLockoutDescription = (lockoutCount, lockDuration) => {
    const countMap = {
        1: '1st',
        2: '2nd',
        3: '3rd',
        4: '4th',
        5: '5th'
    };
    const ordinal = countMap[lockoutCount] || `${lockoutCount}th`;
    return `${ordinal} lockout (${lockDuration} minute${lockDuration > 1 ? 's' : ''})`;
};

setInterval(() => {
    const now = Date.now();
    Object.keys(loginAttempts).forEach(email => {
        const data = loginAttempts[email];
        if (data.lockedUntil && data.lockedUntil < now) {
            delete loginAttempts[email];
        }
        if (data.firstAttempt && (now - data.firstAttempt) > 3600000) {
            delete loginAttempts[email];
        }
    });
}, 3600000);

class AuthController {
    static recordFailedAttempt(email) {
        const normalizedEmail = email.trim().toLowerCase();
        
        if (!loginAttempts[normalizedEmail]) {
            loginAttempts[normalizedEmail] = {
                attempts: 0,
                firstAttempt: Date.now(),
                lockedUntil: null,
                lockoutCount: 0
            };
        }
        
        loginAttempts[normalizedEmail].attempts += 1;
        console.log(` Failed attempt ${loginAttempts[normalizedEmail].attempts} for ${normalizedEmail}`);
    }

    // ============================================
    // ✅ GENERATE OTP
    // ============================================
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

   // ============================================
// ✅ GENERATE ACCESS TOKEN (Short-lived)
// Accepts both { User_id, role_type, role_id } (learner rows)
// and { userId, role, roleId, userType } (normalized login payload)
// ============================================
static generateAccessToken(user) {
    const userId = user.userId ?? user.User_id;

    return jwt.sign(
        {
            userId,
            email: user.email,
            name: user.name,
            surname: user.surname,
            role: user.role ?? user.role_type ?? 'USER',
            roleId: user.roleId ?? user.role_id ?? 2,
            userType: user.userType ?? 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// ============================================
// ✅ GENERATE REFRESH JWT
// Accepts both field-name variants
// ============================================
static generateRefreshJWT(user) {
    const userId = user.userId ?? user.User_id;

    return jwt.sign(
        {
            userId,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}
    // ============================================
    // ✅ CREATE SESSION ON LOGIN
    // ============================================
    static async createSession(userId, refreshToken, ipAddress, userAgent) {
        try {
            // Expire any existing active sessions for this user
            await pool.execute(
                'UPDATE session SET status = "expired" WHERE user_id = ? AND status = "active"',
                [userId]
            );

            // Create new session
            const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const [result] = await pool.execute(
                `INSERT INTO session 
                 (user_id, session_token, status, expire_at, ip_address, user_agent) 
                 VALUES (?, ?, 'active', ?, ?, ?)`,
                [userId, refreshToken, expireAt, ipAddress, userAgent]
            );

            console.log(` Session created for user ${userId}`);
            return result.insertId;
        } catch (error) {
            console.error('Error creating session:', error.message);
            return null;
        }
    }

    // ============================================
    // ✅ VALIDATE SESSION
    // ============================================
    static async validateSession(refreshToken) {
        try {
            const [sessions] = await pool.execute(
                `SELECT s.*, u.User_id, u.name, u.surname, u.email, u.role_id
                 FROM session s
                 JOIN user u ON s.user_id = u.User_id
                 WHERE s.session_token = ? AND s.status = 'active' AND s.expire_at > NOW()
                 LIMIT 1`,
                [refreshToken]
            );

            if (sessions.length === 0) {
                return null;
            }

            return sessions[0];
        } catch (error) {
            console.error(' Error validating session:', error.message);
            return null;
        }
    }

    // ============================================
    // ✅ VALIDATE AND CLEAN PHONE NUMBER
    // ============================================
    static validateAndCleanPhone(phone) {
        if (!phone) {
            return { valid: false, message: 'Phone number is required' };
        }

        let cleaned = phone.replace(/[\s\-\(\)]/g, '');

        if (cleaned.startsWith('+27')) {
            let afterCode = cleaned.substring(3);
            if (afterCode.startsWith('0')) {
                return { 
                    valid: false, 
                    message: 'Invalid number. Please enter exactly 9 digits after +27' 
                };
            }
            let digitsOnly = afterCode.replace(/\D/g, '');
            if (digitsOnly.length !== 9) {
                return { 
                    valid: false, 
                    message: `Please enter exactly 9 digits after +27. You entered ${digitsOnly.length}.` 
                };
            }
            return { valid: true, message: 'Valid phone number', cleaned: '0' + digitsOnly };
        }

        if (cleaned.startsWith('27')) {
            let afterCode = cleaned.substring(2);
            if (afterCode.startsWith('0')) {
                return { 
                    valid: false, 
                    message: 'Invalid number. Please enter exactly 9 digits after 27' 
                };
            }
            let digitsOnly = afterCode.replace(/\D/g, '');
            if (digitsOnly.length !== 9) {
                return { 
                    valid: false, 
                    message: `Please enter exactly 9 digits after 27. You entered ${digitsOnly.length}.` 
                };
            }
            return { valid: true, message: 'Valid phone number', cleaned: '0' + digitsOnly };
        }

        if (cleaned.startsWith('0')) {
            let digitsOnly = cleaned.replace(/\D/g, '');
            if (digitsOnly.length !== 10) {
                return { 
                    valid: false, 
                    message: `Phone number must be exactly 10 digits. You entered ${digitsOnly.length}.` 
                };
            }
            return { valid: true, message: 'Valid phone number', cleaned: digitsOnly };
        }

        return { 
            valid: false, 
            message: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' 
        };
    }

    // ============================================
    //  VALIDATE EMAIL WITH DISPOSABLE BLOCKING
    // ============================================
    static validateEmail(email) {
        if (!email) {
            return { valid: false, message: 'Email is required' };
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }

        // Block disposable/temporary email domains
        const disposableDomains = [
            'tempmail.com', '10minutemail.com', 'guerrillamail.com',
            'mailinator.com', 'throwawaymail.com', 'temp-mail.org',
            'yopmail.com', 'spamgourmet.com', 'trashmail.com',
            'mytemp.email', 'fakeinbox.com', 'mailnator.com',
            'dispostable.com', 'mailnesia.com', 'guerrillamail.net'
        ];
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
            return { valid: false, message: 'Please use a permanent email address' };
        }

        return { valid: true, message: 'Valid email' };
    }

        // ============================================
    //  SIGNUP (staged — user is created only after OTP verification)
    // ============================================
    static async signup(req, res) {
        try {
            console.log(' Signup request received');

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const {
                name,
                surname,
                email,
                phone_number,
                gender_id,
                id_number,
                password,
                confirmPassword,
                terms_accepted,
                captchaToken,
                physicalAddress
            } = req.body;

            // Validate email with disposable blocking
            const emailValidation = AuthController.validateEmail(email);
            if (!emailValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Email validation failed',
                    errors: [{ field: 'email', message: emailValidation.message }]
                });
            }

            // Verify CAPTCHA if enabled
            if (process.env.ENABLE_CAPTCHA === 'true') {
                if (!captchaToken) {
                    return res.status(400).json({
                        success: false,
                        message: 'CAPTCHA verification required',
                        errors: [{ field: 'captcha', message: 'Please complete the CAPTCHA' }]
                    });
                }

                try {
                    const response = await fetch(
                        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
                        { method: 'POST' }
                    );
                    const data = await response.json();

                    if (!data.success) {
                        return res.status(400).json({
                            success: false,
                            message: 'CAPTCHA verification failed. Please try again.',
                            errors: [{ field: 'captcha', message: 'CAPTCHA verification failed' }]
                        });
                    }
                } catch (captchaError) {
                    console.error(' CAPTCHA verification error:', captchaError);
                    return res.status(500).json({
                        success: false,
                        message: 'CAPTCHA verification failed. Please try again.'
                    });
                }
            }

            const phoneValidation = AuthController.validateAndCleanPhone(phone_number);
            if (!phoneValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number validation failed',
                    errors: [{ field: 'phone_number', message: phoneValidation.message }]
                });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Passwords do not match',
                    errors: [{ field: 'confirmPassword', message: 'Passwords do not match' }]
                });
            }

            if (!terms_accepted) {
                return res.status(400).json({
                    success: false,
                    message: 'You must agree to the Terms of Service',
                    errors: [{ field: 'terms', message: 'You must agree to the Terms of Service' }]
                });
            }

            const normalizedEmail = email.toLowerCase().trim();

            // ---- Check the DB: is this email or ID already taken? ----
            const existingEmail = await User.findByEmail(normalizedEmail);
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered',
                    errors: [{ field: 'email', message: 'Email already registered. Please use a different email or login.' }]
                });
            }

            const existingId = await User.findByIdNumber(id_number.trim());
            if (existingId) {
                return res.status(409).json({
                    success: false,
                    message: 'ID number already registered',
                    errors: [{ field: 'id_number', message: 'ID number already registered. Please contact support.' }]
                });
            }

            // ---- Generate OTP and stash the pending signup in memory ----
            // NOTE: The password is stored as plaintext in memory only.
            //       User.create() hashes it once, at verification time.
            const otp = AuthController.generateOTP();
            const now = Date.now();

            pendingSignups.set(normalizedEmail, {
                name: name.trim(),
                surname: surname.trim(),
                email: normalizedEmail,
                phone_number: phoneValidation.cleaned,
                gender_id: gender_id ? parseInt(gender_id) : null,
                id_number: id_number.trim(),
                password: password,                                   // plaintext, memory only
                physicalAddress: physicalAddress ? physicalAddress.trim() : null,
                terms_accepted: true,
                role_id: 2,
                otp,
                issued_at: now,
                expire_at: now + 30 * 60 * 1000,
                attempts: 0
            });

            console.log(`Pending signup staged for ${normalizedEmail}`);

            // ---- Send the OTP email ----
            let otpSent = false;
            const fullName = `${name.trim()} ${surname.trim()}`;

            try {
                await emailService.sendOTPEmail(normalizedEmail, fullName, otp);
                otpSent = true;
                console.log('OTP sent to:', normalizedEmail);
            } catch (error) {
                console.error(' Failed to send OTP email:', error.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${normalizedEmail}: ${otp}`);
                }
            }

            return res.status(201).json({
                success: true,
                message: 'Verification code sent. Please check your email and enter the OTP to finish creating your account.',
                data: {
                    email: normalizedEmail,
                    requiresVerification: true,
                    otpSent,
                    ...(process.env.NODE_ENV === 'development' && !otpSent ? { otp } : {})
                }
            });

        } catch (error) {
            console.error(' Signup error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again later.'
            });
        }
    }
   // ============================================
// ✅ LOGIN  (checks BOTH the user table and the Admin table)
// ============================================
static async login(req, res) {
    try {
        console.log('🔐 Login request received');

        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // ---- Lockout check (unchanged) ----
        if (loginAttempts[normalizedEmail] && loginAttempts[normalizedEmail].lockedUntil) {
            const lockedUntil = loginAttempts[normalizedEmail].lockedUntil;
            const now = Date.now();

            if (lockedUntil > now) {
                const timeLeft = Math.ceil((lockedUntil - now) / 60000);
                const lockoutCount = loginAttempts[normalizedEmail].lockoutCount || 0;
                return res.status(403).json({
                    success: false,
                    error: `Too many failed login attempts. Your account has been locked. Please try again in ${timeLeft} minute${timeLeft > 1 ? 's' : ''}.`,
                    locked: true,
                    timeLeft: timeLeft,
                    attempts: loginAttempts[normalizedEmail].attempts,
                    lockoutCount: lockoutCount
                });
            } else {
                if (loginAttempts[normalizedEmail]) {
                    loginAttempts[normalizedEmail].attempts = 0;
                    loginAttempts[normalizedEmail].lockedUntil = null;
                }
            }
        }

        // =====================================================
        // STEP 1: Try the learner table first
        // =====================================================
        let account = await User.findByEmail(normalizedEmail);
        let accountType = account ? 'user' : null;

        // =====================================================
        // STEP 2: If not found, try the Admin table
        // =====================================================
        if (!account) {
            try {
                account = await Admin.findByEmail(normalizedEmail);
                if (account) accountType = 'admin';
            } catch (adminError) {
                console.error('Admin lookup error:', adminError.message);
            }
        }

        // =====================================================
        // STEP 3: Neither table matched
        // =====================================================
        if (!account) {
            AuthController.recordFailedAttempt(normalizedEmail);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // =====================================================
        // STEP 4: Email verification gate — learners only.
        // Admins are created by other admins and are trusted.
        // =====================================================
        if (accountType === 'user' && !account.email_verify) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your email first. Check your inbox for the OTP.',
                requiresVerification: true,
                email: normalizedEmail
            });
        }

        // =====================================================
        // STEP 5: Verify password against the correct hash column
        // =====================================================
        const storedHash = accountType === 'user'
            ? account.password_hash
            : account.Password;

        let isValidPassword = false;
        try {
            isValidPassword = await bcrypt.compare(password, storedHash);
        } catch (compareErr) {
            console.error('Password compare error:', compareErr.message);
            isValidPassword = false;
        }

        if (!isValidPassword) {
            AuthController.recordFailedAttempt(normalizedEmail);

            const attempts = loginAttempts[normalizedEmail]?.attempts || 0;
            const maxAttempts = 3;

            if (attempts === 2) {
                try {
                    const displayName = accountType === 'user'
                        ? `${account.name} ${account.surname}`
                        : `${account.Name} ${account.Surname}`;
                    await emailService.sendLoginAlertEmail(
                        normalizedEmail,
                        displayName,
                        ipAddress,
                        userAgent
                    );
                } catch (emailError) {
                    console.error('Failed to send login alert:', emailError.message);
                }
            }

            if (attempts >= maxAttempts) {
                const currentLockoutCount = loginAttempts[normalizedEmail]?.lockoutCount || 0;
                const newLockoutCount = currentLockoutCount + 1;

                const lockDuration = getLockDuration(newLockoutCount);
                const lockedUntil = Date.now() + lockDuration * 60000;

                if (loginAttempts[normalizedEmail]) {
                    loginAttempts[normalizedEmail].lockedUntil = lockedUntil;
                    loginAttempts[normalizedEmail].lockoutCount = newLockoutCount;
                    loginAttempts[normalizedEmail].attempts = 0;
                }

                try {
                    const displayName = accountType === 'user'
                        ? `${account.name} ${account.surname}`
                        : `${account.Name} ${account.Surname}`;
                    const lockoutDescription = getLockoutDescription(newLockoutCount, lockDuration);
                    await emailService.sendLockNotificationEmail(
                        normalizedEmail,
                        displayName,
                        attempts,
                        lockDuration,
                        ipAddress,
                        userAgent,
                        newLockoutCount,
                        lockoutDescription
                    );
                    console.log(`📧 Lock notification sent to: ${normalizedEmail}`);
                } catch (emailError) {
                    console.error('Failed to send lock notification:', emailError.message);
                }

                return res.status(403).json({
                    success: false,
                    error: `Account locked due to ${attempts} failed login attempts. Please try again in ${lockDuration} minute${lockDuration > 1 ? 's' : ''}.`,
                    locked: true,
                    timeLeft: lockDuration,
                    attempts: attempts,
                    lockoutCount: newLockoutCount,
                    lockDuration: lockDuration
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
                attempts: attempts,
                maxAttempts: maxAttempts,
                remainingAttempts: maxAttempts - attempts
            });
        }

        // ---- Successful login - reset attempts (unchanged) ----
        if (loginAttempts[normalizedEmail]) {
            delete loginAttempts[normalizedEmail];
        }

        // =====================================================
        // STEP 6: Build the response — one shape for both tables
        // =====================================================
        let id, name, surname, userEmail, phone_number, role, roleId, isVerified, registerAt;

        if (accountType === 'user') {
            const [roleResult] = await pool.execute(
                'SELECT role_id, role_type FROM role WHERE role_id = ?',
                [account.role_id || 2]
            );
            const roleData = roleResult[0] || { role_id: 2, role_type: 'USER' };

            id = account.User_id;
            name = account.name;
            surname = account.surname;
            userEmail = account.email;
            phone_number = account.phone_number;
            role = roleData.role_type || 'USER';
            roleId = roleData.role_id || 2;
            isVerified = account.email_verify === 1 || account.email_verify === true;
            registerAt = account.register_at;
        } else {
            // Admin table
            id = account.Admin_ID;
            name = account.Name;
            surname = account.Surname;
            userEmail = account.Email_address;
            phone_number = account.Phone_number;
            roleId = account.role_ID;
            // role_ID 1 = ADMIN, 3 = Super Admin, anything else = ADMIN
            role = roleId === 3 ? 'Super Admin'
                 : roleId === 1 ? 'ADMIN'
                 : 'ADMIN';
            isVerified = true; // Admins are trusted
            registerAt = account.created_at || null;
        }

        // Generate tokens
        const tokenPayload = {
            userId: id,
            email: userEmail,
            name,
            surname,
            role,
            roleId,
            userType: accountType
        };

        const accessToken = AuthController.generateAccessToken(tokenPayload);
        const refreshToken = AuthController.generateRefreshJWT(tokenPayload);

        // Create session
        await AuthController.createSession(id, refreshToken, ipAddress, userAgent);

        // Set HTTP-only secure cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id,
                    name,
                    surname,
                    email: userEmail,
                    phone_number,
                    role,
                    roleId,
                    userType: accountType,           // 'user' | 'admin'
                    isVerified,
                    register_at: registerAt
                }
            }
        });

    } catch (error) {
        console.error(' Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
}
    // ============================================
    // ✅ REFRESH TOKEN
    // ============================================
    static async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token required'
                });
            }

            // Validate session
            const session = await AuthController.validateSession(refreshToken);
            
            if (!session) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired session'
                });
            }

            // Get user role
            const [roleResult] = await pool.execute(
                'SELECT role_id, role_type FROM role WHERE role_id = ?',
                [session.role_id || 2]
            );
            const roleData = roleResult[0] || { role_id: 2, role_type: 'USER' };

            // Generate new access token
            const accessToken = AuthController.generateAccessToken({
                ...session,
                role_type: roleData.role_type,
                role_id: roleData.role_id
            });

            // Set new access token cookie
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                data: {
                    accessToken,
                    expiresIn: '7d'
                }
            });

        } catch (error) {
            console.error(' Refresh token error:', error);
            res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token'
            });
        }
    }

    // ============================================
    // ✅ LOGOUT
    // ============================================
    static async logout(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            // Update session status to logged_out
            if (refreshToken) {
                await pool.execute(
                    'UPDATE session SET status = "logged_out", logout_at = NOW() WHERE session_token = ?',
                    [refreshToken]
                );
            }

            // Clear all auth cookies
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error(' Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed'
            });
        }
    }

         // ============================================
    // ✅ SEND REGISTRATION OTP
    // Works against the in-memory pending signup — no DB lookup
    // ============================================
    static async sendRegistrationOTP(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();
            console.log(` Sending registration OTP to ${normalizedEmail}`);

            const pending = pendingSignups.get(normalizedEmail);

            if (!pending) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }

            // If the OTP was issued less than 2 minutes ago, don't spam another email
            const age = Date.now() - (pending.issued_at || 0);
            if (age < 2 * 60 * 1000 && pending.otp) {
                return res.status(200).json({
                    success: true,
                    message: '6-digit OTP has already been sent to your email'
                });
            }

            // Otherwise regenerate
            const otp = AuthController.generateOTP();
            pending.otp = otp;
            pending.issued_at = Date.now();
            pending.expire_at = Date.now() + 30 * 60 * 1000;
            pending.attempts = 0;

            const fullName = `${pending.name} ${pending.surname}`;

            try {
                await emailService.sendOTPEmail(normalizedEmail, fullName, otp);
                console.log(` OTP sent successfully to ${normalizedEmail}`);

                return res.status(200).json({
                    success: true,
                    message: '6-digit OTP has been sent to your email'
                });
            } catch (emailError) {
                console.error(' Email send error:', emailError.message);

                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${normalizedEmail}: ${otp}`);
                    return res.status(200).json({
                        success: true,
                        message: 'OTP generated (development mode)',
                        data: { otp, email: normalizedEmail }
                    });
                }
                throw emailError;
            }

        } catch (error) {
            console.error(' Error sending registration OTP:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again later.'
            });
        }
    }

        // ============================================
    // ✅ VERIFY REGISTRATION OTP
    // Creates the user in the DB — the ONLY write in the whole signup flow
    // ============================================
    static async verifyRegistrationOTP(req, res) {
        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();
            console.log(` Verifying registration OTP for ${normalizedEmail}`);

            const pending = pendingSignups.get(normalizedEmail);

            if (!pending) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }

            if (Date.now() > pending.expire_at) {
                pendingSignups.delete(normalizedEmail);
                return res.status(400).json({
                    success: false,
                    message: 'OTP has expired. Please request a new one.'
                });
            }

            if (pending.otp !== String(otp)) {
                pending.attempts = (pending.attempts || 0) + 1;

                if (pending.attempts >= 5) {
                    pendingSignups.delete(normalizedEmail);
                    return res.status(400).json({
                        success: false,
                        message: 'Too many incorrect attempts. Please register again.'
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP. Please check and try again.'
                });
            }

            // ---- Last-minute race check against the DB ----
            const existingEmail = await User.findByEmail(normalizedEmail);
            if (existingEmail) {
                pendingSignups.delete(normalizedEmail);
                return res.status(409).json({
                    success: false,
                    message: 'This email was just registered by someone else. Please login.'
                });
            }

            const existingId = await User.findByIdNumber(pending.id_number);
            if (existingId) {
                pendingSignups.delete(normalizedEmail);
                return res.status(409).json({
                    success: false,
                    message: 'This ID number was just registered. Please contact support.'
                });
            }

            // ============================================================
            // ✅ Create the user now — the actual DB INSERT happens here
            // ============================================================
            const newUser = await User.create({
                name: pending.name,
                surname: pending.surname,
                email: pending.email,
                phone_number: pending.phone_number,
                gender_id: pending.gender_id,
                id_number: pending.id_number,
                password: pending.password,          // plaintext from staging
                terms_accepted: pending.terms_accepted,
                role_id: pending.role_id,
                physicalAddress: pending.physicalAddress
            });

            console.log(`User created via OTP verification. ID: ${newUser.user_id}`);

            // Mark email_verify = 1 immediately — they just proved it
            try {
                await pool.execute(
                    'UPDATE user SET email_verify = 1 WHERE User_id = ?',
                    [newUser.user_id]
                );
            } catch (updateErr) {
                console.error('Failed to set email_verify:', updateErr.message);
            }

            // Cleanup the pending entry
            pendingSignups.delete(normalizedEmail);

            console.log(`Email verified successfully for ${normalizedEmail}`);

            // Welcome email (best-effort)
            try {
                await emailService.sendWelcomeEmail(
                    normalizedEmail,
                    `${pending.name} ${pending.surname}`
                );
                console.log(' Welcome email sent to:', normalizedEmail);
            } catch (emailError) {
                console.error(' Failed to send welcome email:', emailError.message);
            }

            res.status(200).json({
                success: true,
                message: 'Email verified successfully! You can now login.',
                data: {
                    userId: newUser.user_id,
                    email: newUser.email
                }
            });

        } catch (error) {
            console.error(' Error verifying registration OTP:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify OTP. Please try again.'
            });
        }
    }
        // ============================================
    // ✅ RESEND REGISTRATION OTP
    // Regenerates against the in-memory pending entry
    // ============================================
    static async resendRegistrationOTP(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();
            console.log(`🔄 Resending registration OTP to ${normalizedEmail}`);

            const pending = pendingSignups.get(normalizedEmail);

            if (!pending) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }

            const otp = AuthController.generateOTP();
            pending.otp = otp;
            pending.issued_at = Date.now();
            pending.expire_at = Date.now() + 30 * 60 * 1000;
            pending.attempts = 0;

            const fullName = `${pending.name} ${pending.surname}`;

            try {
                await emailService.sendOTPEmail(normalizedEmail, fullName, otp);
                console.log(` New OTP sent successfully to ${normalizedEmail}`);

                res.status(200).json({
                    success: true,
                    message: 'New 6-digit OTP sent successfully'
                });
            } catch (emailError) {
                console.error(' Email send error:', emailError.message);

                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${normalizedEmail}: ${otp}`);
                    return res.status(200).json({
                        success: true,
                        message: 'New OTP generated (development mode)',
                        data: { otp, email: normalizedEmail }
                    });
                }
                throw emailError;
            }

        } catch (error) {
            console.error(' Error resending registration OTP:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resend OTP. Please try again.'
            });
        }
    }
       // ============================================
    // ✅ FORGOT PASSWORD (learners AND admins)
    // ============================================
    static async forgotPassword(req, res) {
        try {
            console.log('🔑 Forgot password request received');
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();

            // ---- Try learner first, then admin ----
            let account = null;
            let accountType = null;
            let accountId = null;
            let displayName = '';

            const learner = await User.findByEmail(normalizedEmail);
            if (learner) {
                account = learner;
                accountType = 'user';
                accountId = learner.User_id;
                displayName = `${learner.name} ${learner.surname}`;
            } else {
                try {
                    const admin = await Admin.findByEmail(normalizedEmail);
                    if (admin) {
                        account = admin;
                        accountType = 'admin';
                        accountId = admin.Admin_ID;
                        displayName = `${admin.Name} ${admin.Surname}`;
                    }
                } catch (adminErr) {
                    console.error('Admin lookup error in forgotPassword:', adminErr.message);
                }
            }

            if (!account) {
                return res.status(404).json({
                    success: false,
                    error: 'No account found with this email address.'
                });
            }

            const otpCode = AuthController.generateOTP();
            const expireAt = new Date(Date.now() + 15 * 60000);

            // ---- Clear any previous unused OTP ----
            if (accountType === 'user') {
                await pool.execute(
                    'DELETE FROM password_reset WHERE user_id = ? AND use_at IS NULL',
                    [accountId]
                );
            } else {
                await pool.execute(
                    'DELETE FROM password_reset WHERE admin_id = ? AND use_at IS NULL',
                    [accountId]
                );
            }

            // ---- Insert new OTP into the correct column ----
            if (accountType === 'user') {
                await pool.execute(
                    `INSERT INTO password_reset (user_id, admin_id, otp, expire_at, created_at)
                     VALUES (?, NULL, ?, ?, NOW())`,
                    [accountId, otpCode, expireAt]
                );
            } else {
                await pool.execute(
                    `INSERT INTO password_reset (user_id, admin_id, otp, expire_at, created_at)
                     VALUES (NULL, ?, ?, ?, NOW())`,
                    [accountId, otpCode, expireAt]
                );
            }

            try {
                await emailService.sendPasswordResetOTPEmail(
                    normalizedEmail,
                    displayName,
                    otpCode
                );
                console.log('Password reset OTP sent to:', normalizedEmail);
            } catch (emailError) {
                console.error('Failed to send OTP email:', emailError.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${normalizedEmail}: ${otpCode}`);
                    return res.status(200).json({
                        success: true,
                        message: 'OTP generated (development mode)',
                        data: {
                            email: normalizedEmail,
                            expiresIn: '15 minutes',
                            otp: otpCode
                        }
                    });
                }
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send OTP email. Please try again.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'OTP sent to your email. Please check your inbox.',
                data: {
                    email: normalizedEmail,
                    expiresIn: '15 minutes'
                }
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error. Please try again.'
            });
        }
    }

    // ============================================
    // ✅ VERIFY PASSWORD RESET OTP (learners AND admins)
    // ============================================
    static async verifyPasswordResetOTP(req, res) {
        try {
            const { email, otpCode } = req.body;

            if (!email || !otpCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and OTP code are required'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();

            // ---- Which account does this email belong to? ----
            let accountType = null;
            let accountId = null;

            const learner = await User.findByEmail(normalizedEmail);
            if (learner) {
                accountType = 'user';
                accountId = learner.User_id;
            } else {
                try {
                    const admin = await Admin.findByEmail(normalizedEmail);
                    if (admin) {
                        accountType = 'admin';
                        accountId = admin.Admin_ID;
                    }
                } catch (adminErr) {
                    console.error('Admin lookup error in verifyPasswordResetOTP:', adminErr.message);
                }
            }

            if (!accountType) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const idColumn = accountType === 'user' ? 'user_id' : 'admin_id';

            // ---- Look for a valid, unused, non-expired OTP ----
            const [rows] = await pool.execute(
                `SELECT * FROM password_reset
                 WHERE ${idColumn} = ? AND otp = ? AND use_at IS NULL AND expire_at > NOW()
                 ORDER BY created_at DESC LIMIT 1`,
                [accountId, otpCode]
            );

            if (rows.length === 0) {
                // Check specifically for an expired OTP so we can give a clearer message
                const [expiredRows] = await pool.execute(
                    `SELECT * FROM password_reset
                     WHERE ${idColumn} = ? AND otp = ? AND use_at IS NULL AND expire_at <= NOW()
                     ORDER BY created_at DESC LIMIT 1`,
                    [accountId, otpCode]
                );

                if (expiredRows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'OTP has expired. Please request a new one.'
                    });
                }

                return res.status(400).json({
                    success: false,
                    error: 'Invalid OTP code. Please try again.'
                });
            }

            const otpData = rows[0];

            // ---- Mark this OTP as used ----
            await pool.execute(
                'UPDATE password_reset SET use_at = NOW() WHERE password_reset_id = ?',
                [otpData.password_reset_id]
            );

            // ---- Issue a reset token that carries the account type ----
            const resetToken = jwt.sign(
                {
                    userId: accountId,
                    email: normalizedEmail,
                    userType: accountType,          // 'user' | 'admin'
                    purpose: 'password_reset'
                },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.status(200).json({
                success: true,
                message: 'OTP verified successfully! You can now reset your password.',
                data: { resetToken, userId: accountId }
            });

        } catch (error) {
            console.error('OTP verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // ============================================
    // ✅ RESET PASSWORD (learners AND admins)
    // ============================================
    static async resetPassword(req, res) {
        try {
            const { resetToken, newPassword, confirmPassword } = req.body;

            if (!resetToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Reset token is required'
                });
            }

            if (!newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'New password and confirm password are required'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Passwords do not match'
                });
            }

            // Strong password validation — mirrors the signup rules
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 8 characters long'
                });
            }
            if (!/(?=.*[a-z])/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must contain at least one lowercase letter'
                });
            }
            if (!/(?=.*[A-Z])/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must contain at least one uppercase letter'
                });
            }
            if (!/(?=.*\d)/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must contain at least one number'
                });
            }
            if (!/(?=.*[@$!%*?&])/.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must contain at least one special character (@$!%*?&)'
                });
            }

            // ---- Verify the reset token ----
            let decoded;
            try {
                decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return res.status(400).json({
                        success: false,
                        error: 'Reset token has expired. Please request a new OTP.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    error: 'Invalid reset token'
                });
            }

            if (decoded.purpose !== 'password_reset') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid token purpose'
                });
            }

            const { userId, userType } = decoded;

            if (!userId || !userType) {
                return res.status(400).json({
                    success: false,
                    error: 'Reset token is missing required fields'
                });
            }

            // ---- Branch by account type ----
            if (userType === 'user') {
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }
                await User.updatePassword(userId, newPassword);

            } else if (userType === 'admin') {
                const admin = await Admin.getById(userId);
                if (!admin) {
                    return res.status(404).json({
                        success: false,
                        error: 'Admin not found'
                    });
                }
                await Admin.updatePassword(userId, newPassword);

            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Unknown account type'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Password reset successfully! You can now login with your new password.'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    }

    // ============================================
    // ✅ RESEND PASSWORD RESET OTP (learners AND admins)
    // ============================================
    static async resendPasswordResetOTP(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();

            // ---- Try learner first, then admin ----
            let account = null;
            let accountType = null;
            let accountId = null;
            let displayName = '';

            const learner = await User.findByEmail(normalizedEmail);
            if (learner) {
                account = learner;
                accountType = 'user';
                accountId = learner.User_id;
                displayName = `${learner.name} ${learner.surname}`;
            } else {
                try {
                    const admin = await Admin.findByEmail(normalizedEmail);
                    if (admin) {
                        account = admin;
                        accountType = 'admin';
                        accountId = admin.Admin_ID;
                        displayName = `${admin.Name} ${admin.Surname}`;
                    }
                } catch (adminErr) {
                    console.error('Admin lookup error in resendPasswordResetOTP:', adminErr.message);
                }
            }

            if (!account) {
                return res.status(404).json({
                    success: false,
                    error: 'No account found with this email address.'
                });
            }

            const otpCode = AuthController.generateOTP();
            const expireAt = new Date(Date.now() + 15 * 60000);

            // ---- Clear any previous unused OTP ----
            if (accountType === 'user') {
                await pool.execute(
                    'DELETE FROM password_reset WHERE user_id = ? AND use_at IS NULL',
                    [accountId]
                );
            } else {
                await pool.execute(
                    'DELETE FROM password_reset WHERE admin_id = ? AND use_at IS NULL',
                    [accountId]
                );
            }

            // ---- Insert new OTP into the correct column ----
            if (accountType === 'user') {
                await pool.execute(
                    `INSERT INTO password_reset (user_id, admin_id, otp, expire_at, created_at)
                     VALUES (?, NULL, ?, ?, NOW())`,
                    [accountId, otpCode, expireAt]
                );
            } else {
                await pool.execute(
                    `INSERT INTO password_reset (user_id, admin_id, otp, expire_at, created_at)
                     VALUES (NULL, ?, ?, ?, NOW())`,
                    [accountId, otpCode, expireAt]
                );
            }

            try {
                await emailService.sendPasswordResetOTPEmail(
                    normalizedEmail,
                    displayName,
                    otpCode
                );
                console.log('Password reset OTP resent to:', normalizedEmail);
            } catch (emailError) {
                console.error('Failed to send OTP email:', emailError.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${normalizedEmail}: ${otpCode}`);
                    return res.status(200).json({
                        success: true,
                        message: 'New OTP generated (development mode)',
                        data: {
                            email: normalizedEmail,
                            expiresIn: '15 minutes',
                            otp: otpCode
                        }
                    });
                }
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send OTP email. Please try again.'
                });
            }

            res.status(200).json({
                success: true,
                message: 'New OTP sent to your email. Please check your inbox.',
                data: { email: normalizedEmail, expiresIn: '15 minutes' }
            });

        } catch (error) {
            console.error('Resend password reset OTP error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    // ============================================
    // ✅ GET GENDERS
    // ============================================
    static async getGenders(req, res) {
        try {
            const [rows] = await pool.execute('SELECT * FROM gender ORDER BY gender_id');
            
            res.json({
                success: true,
                data: rows.map(g => ({
                    id: g.gender_id,
                    value: g.gender_description.toLowerCase(),
                    label: g.gender_description
                }))
            });

        } catch (error) {
            console.error(' Get genders error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch genders'
            });
        }
    }

    // ============================================
    // ✅ GET ROLES
    // ============================================
    static async getRoles(req, res) {
        try {
            const [rows] = await pool.execute('SELECT * FROM role ORDER BY role_id');
            
            res.json({
                success: true,
                data: rows.map(r => ({
                    id: r.role_id,
                    value: r.role_type.toLowerCase(),
                    label: r.role_type
                }))
            });

        } catch (error) {
            console.error(' Get roles error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch roles'
            });
        }
    }

    // ============================================
    // ✅ GOOGLE OAUTH
    // ============================================
    static async googleAuth(req, res) {
        try {
            const { googleToken } = req.body;

            if (!googleToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Google token is required'
                });
            }

            const ticket = await oauthClient.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { email, given_name, family_name } = payload;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to get email from Google'
                });
            }

            let existingUser = await User.findByEmail(email);
            
            if (existingUser) {
                const [roleResult] = await pool.execute(
                    'SELECT role_id, role_type FROM role WHERE role_id = ?',
                    [existingUser.role_id || 2]
                );
                const roleData = roleResult[0] || { role_id: 2, role_type: 'USER' };

                if (existingUser.email_verify) {
                    const accessToken = AuthController.generateAccessToken({
                        ...existingUser,
                        role_type: roleData.role_type,
                        role_id: roleData.role_id
                    });
                    const refreshToken = AuthController.generateRefreshJWT(existingUser);

                    // Create session
                    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
                    const userAgent = req.headers['user-agent'] || 'Unknown';
                    await AuthController.createSession(existingUser.User_id, refreshToken, ipAddress, userAgent);

                    res.cookie('accessToken', accessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 15 * 60 * 1000
                    });

                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    });

                    return res.status(200).json({
                        success: true,
                        message: 'Login successful',
                        data: {
                            accessToken,
                            refreshToken,
                            user: {
                                id: existingUser.User_id,
                                name: existingUser.name,
                                surname: existingUser.surname,
                                email: existingUser.email,
                                isVerified: true,
                                role: roleData.role_type || 'USER',
                                roleId: roleData.role_id || 2
                            },
                            requiresVerification: false
                        }
                    });
                }

                // User exists but not verified - send OTP
                const otp = AuthController.generateOTP();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                await pool.execute(
                    `INSERT INTO email_verification_tokens (user_id, token, expires_at, used, created_at)
                     VALUES (?, ?, ?, 0, NOW())
                     ON DUPLICATE KEY UPDATE 
                     token = VALUES(token), 
                     expires_at = VALUES(expires_at), 
                     used = 0, 
                     created_at = NOW()`,
                    [existingUser.User_id, otp, expiresAt]
                );

                try {
                    await emailService.sendOTPEmail(email, `${existingUser.name} ${existingUser.surname}`, otp);
                    console.log(' OTP sent to:', email);
                } catch (emailError) {
                    console.error(' Failed to send OTP:', emailError.message);
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`📱 Development OTP for ${email}: ${otp}`);
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: 'Email exists but not verified. Please check your email for the OTP.',
                    data: {
                        userId: existingUser.User_id,
                        email: existingUser.email,
                        fullName: `${existingUser.name} ${existingUser.surname}`,
                        requiresVerification: true,
                        alreadyExists: true,
                        isNewUser: false
                    }
                });
            }

            const googleIdNumber = 'G' + Date.now().toString().slice(-12);
            
            const newUser = await User.create({
                name: given_name || email.split('@')[0],
                surname: family_name || 'Google',
                email: email,
                phone_number: null,
                gender_id: null,
                id_number: googleIdNumber,
                password: Math.random().toString(36).slice(-12),
                terms_accepted: true,
                role_id: 2
            });

            // Generate and send OTP
            const otp = AuthController.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await pool.execute(
                `INSERT INTO email_verification_tokens (user_id, token, expires_at, used, created_at)
                 VALUES (?, ?, ?, 0, NOW())`,
                [newUser.user_id, otp, expiresAt]
            );

            try {
                await emailService.sendOTPEmail(email, `${newUser.name} ${newUser.surname}`, otp);
                console.log(' OTP sent to:', email);
            } catch (emailError) {
                console.error(' Failed to send OTP:', emailError.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${email}: ${otp}`);
                }
            }

            res.status(200).json({
                success: true,
                message: 'Google authentication successful! Please check your email for the OTP.',
                data: {
                    userId: newUser.user_id,
                    email: newUser.email,
                    fullName: `${newUser.name} ${newUser.surname}`,
                    requiresVerification: true,
                    isNewUser: true,
                    alreadyExists: false
                }
            });

        } catch (error) {
            console.error(' Google auth error:', error.message);
            res.status(500).json({
                success: false,
                error: 'Google authentication failed. Please try again.'
            });
        }
    }
}

module.exports = AuthController;