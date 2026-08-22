// backend/controllers/authController.js
const User = require('../models/users');
const Admin = require('../models/admin'); // ✅ ADD THIS
const Verification = require('../models/verification');
const PasswordReset = require('../models/PasswordReset');
const { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validate } = require('south-african-id-validator');
const { validationResult } = require('express-validator');


// VALIDATION FUNCTIONS - User-friendly messages


const validateFullName = (name) => {
    const trimmed = name?.trim();
    if (!trimmed) return 'Please enter your full name';
    if (trimmed.length < 2) return 'Full name must be at least 2 characters long';
    if (trimmed.length > 200) return 'Full name is too long (maximum 200 characters)';
    if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
        return 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
};

const validateEmail = (email) => {
    const trimmed = email?.trim();
    if (!trimmed) return 'Please enter your email address';
    if (trimmed.length > 255) return 'Email address is too long (maximum 255 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return 'Please enter a valid email address (e.g., name@example.com)';
    }
    return null;
};

const validatePhone = (phone) => {
    const trimmed = phone?.trim();
    if (!trimmed) return 'Please enter your phone number';
    const cleanPhone = trimmed.replace(/\D/g, '');
    if (cleanPhone.length === 0) return 'Phone number is required';
    if (cleanPhone.length < 10) return 'Phone number must be exactly 10 digits (you entered ' + cleanPhone.length + ')';
    if (cleanPhone.length > 10) return 'Phone number cannot exceed 10 digits (you entered ' + cleanPhone.length + ')';
    if (!/^[0-9]+$/.test(cleanPhone)) {
        return 'Phone number can only contain numbers';
    }
    return null;
};

const validateIdNumber = (idNumber) => {
    const trimmed = idNumber?.trim();
    if (!trimmed) return 'Please enter your ID or passport number';
    const cleanId = trimmed.replace(/\D/g, '');
    if (cleanId.length === 0) return 'ID number is required';
    if (cleanId.length !== 13) {
        return 'South African ID number must be exactly 13 digits (you entered ' + cleanId.length + ')';
    }
    try {
        const result = validate(cleanId);
        if (!result.valid) {
            return 'Invalid South African ID number: ' + result.error;
        }
        return null;
    } catch (error) {
        console.error('ID validation error:', error);
        return 'Invalid South African ID number format';
    }
};

const validateGender = (gender) => {
    if (!gender) return null;
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (!validGenders.includes(gender)) {
        return 'Please select a valid gender option';
    }
    return null;
};

const validatePassword = (password) => {
    if (!password) return 'Please create a password';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (password.length > 100) return 'Password is too long (maximum 100 characters)';
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter (a-z)';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter (A-Z)';
    }
    if (!/\d/.test(password)) {
        return 'Password must contain at least one number (0-9)';
    }
    if (!/[@$!%*?&]/.test(password)) {
        return 'Password must contain at least one special character (@$!%*?&)';
    }
    const commonPasswords = ['password', 'password123', '12345678', 'qwerty123', 'Password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
        return 'This password is too common. Please choose a stronger one';
    }
    return null;
};

const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match. Please re-enter';
    return null;
};

const validateTerms = (agreeTerms) => {
    if (!agreeTerms) return 'You must agree to the Terms of Service to continue';
    return null;
};


// REGISTER - WITH USER-FRIENDLY ERRORS


exports.register = async (req, res, next) => {
    try {
        // Check express-validator errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const fieldErrors = {};
            errors.array().forEach(err => {
                fieldErrors[err.path] = err.msg;
            });
            
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: fieldErrors
            });
        }

        const { 
            fullName, 
            email, 
            phone, 
            idNumber,
            gender,
            password, 
            confirmPassword, 
            agreeTerms 
        } = req.body;
        
        // Additional validations
        const validationErrors = {};
        
        const nameError = validateFullName(fullName);
        if (nameError) validationErrors.fullName = nameError;
        
        const emailError = validateEmail(email);
        if (emailError) validationErrors.email = emailError;
        
        const phoneError = validatePhone(phone);
        if (phoneError) validationErrors.phone = phoneError;
        
        const idError = validateIdNumber(idNumber);
        if (idError) validationErrors.idNumber = idError;
        
        const genderError = validateGender(gender);
        if (genderError) validationErrors.gender = genderError;
        
        const passwordError = validatePassword(password);
        if (passwordError) validationErrors.password = passwordError;
        
        const confirmError = validateConfirmPassword(confirmPassword, password);
        if (confirmError) validationErrors.confirmPassword = confirmError;
        
        const termsError = validateTerms(agreeTerms);
        if (termsError) validationErrors.terms = termsError;
        
        if (Object.keys(validationErrors).length > 0) {
            const firstErrorKey = Object.keys(validationErrors)[0];
            return res.status(400).json({
                status: 'error',
                message: validationErrors[firstErrorKey],
                field: firstErrorKey,
                errors: validationErrors
            });
        }
        
        // Sanitize inputs
        const sanitizedFullName = fullName.trim().replace(/[^\w\s'-]/g, '');
        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedPhone = phone.replace(/\D/g, '');
        const sanitizedIdNumber = idNumber.replace(/\D/g, '');
        
        // Check if email exists
        const emailExists = await User.emailExists(sanitizedEmail);
        if (emailExists) {
            return res.status(400).json({
                status: 'error',
                message: 'This email is already registered. Please use a different email or login.',
                field: 'email'
            });
        }
        
        // Check if ID number exists
        const idExists = await User.idNumberExists(sanitizedIdNumber);
        if (idExists) {
            return res.status(400).json({
                status: 'error',
                message: 'This ID/Passport number is already registered. Please use a different ID or login.',
                field: 'idNumber'
            });
        }
        
        // Create user
        const registerId = await User.create({
            fullName: sanitizedFullName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            idNumber: sanitizedIdNumber,
            gender: gender || 'prefer_not_to_say',
            password,
            agreeTerms
        });
        
        const verificationToken = await Verification.createToken(registerId);
        await sendVerificationEmail(sanitizedEmail, verificationToken, sanitizedFullName);
        
        res.status(201).json({
            status: 'success',
            message: '✅ Registration successful! Please check your email to verify your account.',
            data: {
                registerId,
                email: sanitizedEmail,
                fullName: sanitizedFullName,
                phone: sanitizedPhone,
                idNumber: sanitizedIdNumber,
                gender: gender || 'prefer_not_to_say'
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// VERIFY EMAIL


exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Verification token is missing. Please check your email link.'
            });
        }
        
        const registerId = await Verification.verifyToken(token);
        
        if (!registerId) {
            return res.status(400).json({
                status: 'error',
                message: 'This verification link is invalid or has expired. Please request a new one.'
            });
        }
        
        await User.verifyEmail(registerId);
        
        const user = await User.findById(registerId);
        
        if (user) {
            await sendWelcomeEmail(user.email, user.full_name);
        }
        
        res.status(200).json({
            status: 'success',
            message: '✅ Email verified successfully! You can now login.',
            data: {
                registerId,
                email: user?.email,
                fullName: user?.full_name,
                gender: user?.gender
            }
        });
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// LOGIN - WITH ADMIN DETECTION 


exports.login = async (req, res, next) => {
    try {
        // Check express-validator errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const fieldErrors = {};
            errors.array().forEach(err => {
                fieldErrors[err.path] = err.msg;
            });
            
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: fieldErrors
            });
        }

        const { email, password } = req.body;
        
        // FIRST: Check if user is an ADMIN
        const admin = await Admin.findByEmail(email);
        if (admin) {
            // Compare plain text password (for now)
            // Later you'll use bcrypt.compare
            if (password !== admin.password) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password. Please try again.'
                });
            }
            
            // Generate JWT token for admin
            const token = jwt.sign(
                { 
                    adminId: admin.admin_id,
                    email: admin.email,
                    centerName: admin.center_name,
                    userType: 'admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            const adminData = {
                id: admin.admin_id,
                email: admin.email,
                centerName: admin.center_name,
                userType: 'admin'
            };
            
            return res.status(200).json({
                status: 'success',
                message: '✅ Admin login successful!',
                data: {
                    user: adminData,
                    token,
                    redirectTo: '/admin/dashboard'
                }
            });
        }
        
        // SECOND: Check if user is a LEARNER
        const user = await User.findByEmail(email);
        if (user) {
            if (!user.is_verified) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Please verify your email before logging in.',
                    field: 'email'
                });
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid email or password. Please try again.'
                });
            }
            
            await User.updateLastLogin(user.register_id);
            
            const token = jwt.sign(
                { 
                    userId: user.register_id,
                    email: user.email,
                    fullName: user.full_name,
                    gender: user.gender,
                    userType: 'learner'
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            const userData = {
                id: user.register_id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                idNumber: user.id_number,
                gender: user.gender,
                isVerified: user.is_verified,
                userType: 'learner'
            };
            
            return res.status(200).json({
                status: 'success',
                message: '✅ Login successful! Welcome back.',
                data: {
                    user: userData,
                    token,
                    redirectTo: '/learner/homepage'
                }
            });
        }
        
        // THIRD: No user found
        return res.status(401).json({
            status: 'error',
            message: 'Invalid email or password. Please try again.'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// RESEND VERIFICATION


exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Please enter your email address'
            });
        }
        
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'No account found with this email address'
            });
        }
        
        if (user.is_verified) {
            return res.status(400).json({
                status: 'error',
                message: 'This email is already verified. You can login now.'
            });
        }
        
        const verificationToken = await Verification.createToken(user.register_id);
        await sendVerificationEmail(email, verificationToken, user.full_name);
        
        res.status(200).json({
            status: 'success',
            message: '✅ Verification email resent successfully! Please check your inbox.'
        });
        
    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// GET CURRENT USER


exports.getCurrentUser = async (req, res, next) => {
    try {
        // Check if admin or learner
        if (req.user.userType === 'admin') {
            const admin = await Admin.findById(req.user.userId);
            if (!admin) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Admin not found'
                });
            }
            return res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        id: admin.admin_id,
                        email: admin.email,
                        centerName: admin.center_name,
                        userType: 'admin'
                    }
                }
            });
        }
        
        // Learner
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.register_id,
                    fullName: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    idNumber: user.id_number,
                    gender: user.gender,
                    isVerified: user.is_verified,
                    registeredAt: user.registered_at,
                    userType: 'learner'
                }
            }
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// LOGOUT


exports.logout = async (req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// FORGOT PASSWORD

exports.forgotPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const fieldErrors = {};
            errors.array().forEach(err => {
                fieldErrors[err.path] = err.msg;
            });
            
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: fieldErrors
            });
        }

        const { email } = req.body;
        
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'No account found with this email address'
            });
        }
        
        const resetToken = await PasswordReset.createToken(user.register_id);
        await sendPasswordResetEmail(email, resetToken, user.full_name);
        
        res.status(200).json({
            status: 'success',
            message: 'Password reset link sent to your email'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};


// RESET PASSWORD

exports.resetPassword = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const fieldErrors = {};
            errors.array().forEach(err => {
                fieldErrors[err.path] = err.msg;
            });
            
            return res.status(400).json({
                status: 'error',
                message: errors.array()[0].msg,
                errors: fieldErrors
            });
        }

        const { token, password, confirmPassword } = req.body;
        
        const userId = await PasswordReset.verifyToken(token);
        if (!userId) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired reset token'
            });
        }
        
        await User.updatePassword(userId, password);
        await PasswordReset.markUsed(token);
        
        res.status(200).json({
            status: 'success',
            message: 'Password reset successfully! You can now login.'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
};