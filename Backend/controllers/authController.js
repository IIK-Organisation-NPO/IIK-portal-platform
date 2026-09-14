// backend/controllers/authController.js
const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const emailService = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');
const crypto = require('crypto');

dotenv.config();

const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    // ============================================
    static generateAccessToken(user) {
        return jwt.sign(
            { 
                userId: user.User_id, 
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role_type || 'USER',
                roleId: user.role_id || 2
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    // ============================================
    // ✅ GENERATE REFRESH JWT
    // ============================================
    static generateRefreshJWT(user) {
        return jwt.sign(
            { 
                userId: user.User_id,
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
    //  SIGNUP
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
                captchaToken
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

            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered',
                    errors: [{ field: 'email', message: 'Email already registered. Please use a different email or login.' }]
                });
            }

            const existingId = await User.findByIdNumber(id_number);
            if (existingId) {
                return res.status(409).json({
                    success: false,
                    message: 'ID number already registered',
                    errors: [{ field: 'id_number', message: 'ID number already registered. Please contact support.' }]
                });
            }

            const newUser = await User.create({
                name: name.trim(),
                surname: surname.trim(),
                email: email.toLowerCase().trim(),
                phone_number: phoneValidation.cleaned,
                gender_id: gender_id ? parseInt(gender_id) : null,
                id_number: id_number.trim(),
                password: password,
                terms_accepted: terms_accepted,
                role_id: 2
            });

            console.log(' User created with ID:', newUser.user_id);

            // Generate OTP for email verification
            const otp = AuthController.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            // Ensure email_verification_tokens table exists
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS email_verification_tokens (
                        token_id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        token VARCHAR(255) NOT NULL,
                        expires_at DATETIME NOT NULL,
                        used BOOLEAN DEFAULT FALSE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_email_verification_user
                            FOREIGN KEY (user_id)
                            REFERENCES user(User_id)
                            ON DELETE CASCADE,
                        INDEX idx_token (token),
                        INDEX idx_expires (expires_at),
                        INDEX idx_user_token (user_id, token)
                    )
                `);
            } catch (tableError) {
                console.log(' Table creation error:', tableError.message);
            }

            // Store OTP in database
            await pool.execute(
                `INSERT INTO email_verification_tokens (user_id, token, expires_at, used, created_at)
                 VALUES (?, ?, ?, 0, NOW())`,
                [newUser.user_id, otp, expiresAt]
            );

            // Send OTP email
            let otpSent = false;
            const fullName = `${newUser.name} ${newUser.surname}`;
            
            try {
                await emailService.sendOTPEmail(email, fullName, otp);
                otpSent = true;
                console.log('OTP sent to:', email);
            } catch (error) {
                console.error(' Failed to send OTP email:', error.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${email}: ${otp}`);
                }
            }

            // Generate tokens
            const accessToken = AuthController.generateAccessToken(newUser);
            const refreshToken = AuthController.generateRefreshJWT(newUser);

            // Create session
            const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
            const userAgent = req.headers['user-agent'] || 'Unknown';
            await AuthController.createSession(newUser.user_id, refreshToken, ipAddress, userAgent);

            // Set HTTP-only secure cookies
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

            res.status(201).json({
                success: true,
                message: 'Account created! Please check your email for the OTP to verify your account.',
                data: {
                    user: {
                        id: newUser.user_id,
                        name: newUser.name,
                        surname: newUser.surname,
                        email: newUser.email,
                        phone_number: newUser.phone_number,
                        gender_id: newUser.gender_id,
                        id_number: newUser.id_number,
                        role: 'USER',
                        roleId: 2
                    },
                    accessToken,
                    refreshToken,
                    requiresVerification: true,
                    otpSent: otpSent,
                    email: email,
                    ...(process.env.NODE_ENV === 'development' && !otpSent ? { otp: otp } : {})
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
    // ✅ LOGIN
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

            // Check if account is currently locked
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

            const user = await User.findByEmail(normalizedEmail);
            
            if (!user) {
                AuthController.recordFailedAttempt(normalizedEmail);
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            if (!user.email_verify) {
                return res.status(403).json({
                    success: false,
                    error: 'Please verify your email first. Check your inbox for the OTP.',
                    requiresVerification: true,
                    email: normalizedEmail
                });
            }

            const isValidPassword = await User.verifyPassword(password, user.password_hash);
            
            if (!isValidPassword) {
                AuthController.recordFailedAttempt(normalizedEmail);
                
                const attempts = loginAttempts[normalizedEmail]?.attempts || 0;
                const maxAttempts = 3;
                
                if (attempts === 2) {
                    try {
                        await emailService.sendLoginAlertEmail(
                            normalizedEmail,
                            `${user.name} ${user.surname}`,
                            ipAddress,
                            userAgent
                        );
                    } catch (emailError) {
                        console.error(' Failed to send login alert:', emailError.message);
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
                        const lockoutDescription = getLockoutDescription(newLockoutCount, lockDuration);
                        await emailService.sendLockNotificationEmail(
                            normalizedEmail,
                            `${user.name} ${user.surname}`,
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

            // Successful login - reset all attempts
            if (loginAttempts[normalizedEmail]) {
                delete loginAttempts[normalizedEmail];
            }

            const [roleResult] = await pool.execute(
                'SELECT role_id, role_type FROM role WHERE role_id = ?',
                [user.role_id || 2]
            );
            const roleData = roleResult[0] || { role_id: 2, role_type: 'USER' };

            // Generate tokens
            const accessToken = AuthController.generateAccessToken({
                ...user,
                role_type: roleData.role_type,
                role_id: roleData.role_id
            });
            const refreshToken = AuthController.generateRefreshJWT(user);

            // Create session
            await AuthController.createSession(user.User_id, refreshToken, ipAddress, userAgent);

            // Set HTTP-only secure cookies
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

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.User_id,
                        name: user.name,
                        surname: user.surname,
                        email: user.email,
                        phone_number: user.phone_number,
                        gender: user.gender_description,
                        role: roleData.role_type || 'USER',
                        roleId: roleData.role_id || 2,
                        isVerified: user.email_verify === 1,
                        register_at: user.register_at
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
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                data: {
                    accessToken,
                    expiresIn: '15m'
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
                sameSite: 'strict'
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

            console.log(`📧 Sending registration OTP to ${email}`);

            const otp = AuthController.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const [users] = await pool.execute(
                'SELECT User_id, name, surname FROM user WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }

            const user = users[0];
            const fullName = `${user.name} ${user.surname}`;

            // Ensure table exists
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS email_verification_tokens (
                        token_id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        token VARCHAR(255) NOT NULL,
                        expires_at DATETIME NOT NULL,
                        used BOOLEAN DEFAULT FALSE,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_email_verification_user
                            FOREIGN KEY (user_id)
                            REFERENCES user(User_id)
                            ON DELETE CASCADE,
                        INDEX idx_token (token),
                        INDEX idx_expires (expires_at),
                        INDEX idx_user_token (user_id, token)
                    )
                `);
            } catch (tableError) {
                console.log('⚠️ Table creation error:', tableError.message);
            }

            await pool.execute(
                `INSERT INTO email_verification_tokens (user_id, token, expires_at, used, created_at)
                 VALUES (?, ?, ?, 0, NOW())
                 ON DUPLICATE KEY UPDATE 
                 token = VALUES(token), 
                 expires_at = VALUES(expires_at), 
                 used = 0, 
                 created_at = NOW()`,
                [user.User_id, otp, expiresAt]
            );

            try {
                await emailService.sendOTPEmail(email, fullName, otp);
                console.log(`✅ OTP sent successfully to ${email}`);
                
                res.status(200).json({
                    success: true,
                    message: '6-digit OTP has been sent to your email'
                });
            } catch (emailError) {
                console.error('❌ Email send error:', emailError.message);
                
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${email}: ${otp}`);
                    return res.status(200).json({
                        success: true,
                        message: 'OTP generated (development mode)',
                        data: { otp, email }
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

            console.log(`🔐 Verifying registration OTP for ${email}`);

            const [users] = await pool.execute(
                'SELECT User_id FROM user WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userId = users[0].User_id;

            const [tokens] = await pool.execute(
                `SELECT token_id, token, expires_at, used
                 FROM email_verification_tokens
                 WHERE user_id = ? AND token = ? AND used = 0
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [userId, otp]
            );

            if (tokens.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP. Please check and try again.'
                });
            }

            const token = tokens[0];

            if (new Date(token.expires_at) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP has expired. Please request a new one.'
                });
            }

            await pool.execute(
                'UPDATE email_verification_tokens SET used = 1 WHERE token_id = ?',
                [token.token_id]
            );

            await pool.execute(
                'UPDATE user SET email_verify = 1 WHERE User_id = ?',
                [userId]
            );

            console.log(` Email verified successfully for ${email}`);

            // Send welcome email
            try {
                const [userData] = await pool.execute(
                    'SELECT name, surname FROM user WHERE User_id = ?',
                    [userId]
                );
                if (userData.length > 0) {
                    const fullName = `${userData[0].name} ${userData[0].surname}`;
                    await emailService.sendWelcomeEmail(email, fullName);
                    console.log(' Welcome email sent to:', email);
                }
            } catch (emailError) {
                console.error(' Failed to send welcome email:', emailError.message);
            }

            res.status(200).json({
                success: true,
                message: 'Email verified successfully! You can now login.'
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

            console.log(`🔄 Resending registration OTP to ${email}`);

            const [users] = await pool.execute(
                'SELECT User_id, name, surname FROM user WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];
            const fullName = `${user.name} ${user.surname}`;

            const otp = AuthController.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await pool.execute(
                `UPDATE email_verification_tokens 
                 SET token = ?, expires_at = ?, used = 0, created_at = NOW()
                 WHERE user_id = ?`,
                [otp, expiresAt, user.User_id]
            );

            try {
                await emailService.sendOTPEmail(email, fullName, otp);
                console.log(`✅ New OTP sent successfully to ${email}`);
                
                res.status(200).json({
                    success: true,
                    message: 'New 6-digit OTP sent successfully'
                });
            } catch (emailError) {
                console.error(' Email send error:', emailError.message);
                
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${email}: ${otp}`);
                    return res.status(200).json({
                        success: true,
                        message: 'New OTP generated (development mode)',
                        data: { otp, email }
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
    // ✅ FORGOT PASSWORD
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

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'No account found with this email address.'
                });
            }

            const otpCode = AuthController.generateOTP();
            const expireAt = new Date(Date.now() + 15 * 60000);

            await pool.execute(
                'DELETE FROM password_reset WHERE user_id = ? AND used_at IS NULL',
                [user.User_id]
            );
            
            await pool.execute(
                `INSERT INTO password_reset (user_id, token, expire_at) 
                 VALUES (?, ?, ?)`,
                [user.User_id, otpCode, expireAt]
            );

            try {
                await emailService.sendPasswordResetOTPEmail(email, `${user.name} ${user.surname}`, otpCode);
                console.log(' Password reset OTP sent to:', email);
            } catch (emailError) {
                console.error(' Failed to send OTP email:', emailError.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${email}: ${otpCode}`);
                    return res.status(200).json({
                        success: true,
                        message: 'OTP generated (development mode)',
                        data: { 
                            email: email, 
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
                message: 'OTP sent to your email. Please check your inbox.',
                data: { 
                    email: email, 
                    expiresIn: '15 minutes'
                }
            });

        } catch (error) {
            console.error(' Forgot password error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error. Please try again.'
            });
        }
    }

    // ============================================
    // ✅ VERIFY PASSWORD RESET OTP
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

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const [rows] = await pool.execute(
                `SELECT * FROM password_reset 
                 WHERE user_id = ? AND token = ? AND used_at IS NULL AND expire_at > NOW()
                 ORDER BY created_at DESC LIMIT 1`,
                [user.User_id, otpCode]
            );

            if (rows.length === 0) {
                const [expiredRows] = await pool.execute(
                    `SELECT * FROM password_reset 
                     WHERE user_id = ? AND token = ? AND used_at IS NULL AND expire_at <= NOW()
                     ORDER BY created_at DESC LIMIT 1`,
                    [user.User_id, otpCode]
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
            await pool.execute(
                'UPDATE password_reset SET used_at = NOW() WHERE password_reset_id = ?',
                [otpData.password_reset_id]
            );

            const resetToken = jwt.sign(
                { userId: user.User_id, email: email, purpose: 'password_reset' },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.status(200).json({
                success: true,
                message: 'OTP verified successfully! You can now reset your password.',
                data: { resetToken: resetToken, userId: user.User_id }
            });

        } catch (error) {
            console.error(' OTP verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // ============================================
    // ✅ RESET PASSWORD
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

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 8 characters long'
                });
            }

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

            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            await User.updatePassword(decoded.userId, newPassword);

            res.status(200).json({
                success: true,
                message: 'Password reset successfully! You can now login with your new password.'
            });

        } catch (error) {
            console.error(' Reset password error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error: ' + error.message
            });
        }
    }

    // ============================================
    // ✅ RESEND PASSWORD RESET OTP
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

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const otpCode = AuthController.generateOTP();
            const expireAt = new Date(Date.now() + 15 * 60000);

            await pool.execute(
                'DELETE FROM password_reset WHERE user_id = ? AND used_at IS NULL',
                [user.User_id]
            );

            await pool.execute(
                `INSERT INTO password_reset (user_id, token, expire_at) 
                 VALUES (?, ?, ?)`,
                [user.User_id, otpCode, expireAt]
            );

            try {
                await emailService.sendPasswordResetOTPEmail(email, `${user.name} ${user.surname}`, otpCode);
                console.log(' Password reset OTP resent to:', email);
            } catch (emailError) {
                console.error(' Failed to send OTP email:', emailError.message);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`📱 Development OTP for ${email}: ${otpCode}`);
                    return res.status(200).json({
                        success: true,
                        message: 'New OTP generated (development mode)',
                        data: { 
                            email: email, 
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
                data: { email: email, expiresIn: '15 minutes' }
            });

        } catch (error) {
            console.error(' Resend password reset OTP error:', error);
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