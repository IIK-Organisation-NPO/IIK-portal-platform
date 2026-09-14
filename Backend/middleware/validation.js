const { body } = require('express-validator');

// ===== SIGNUP VALIDATION - Matches Database Schema =====
const validateSignup = [
    // 1. Name - Database: name (VARCHAR 100)
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

    // 2. Surname - Database: surname (VARCHAR 100)
    body('surname')
        .trim()
        .notEmpty().withMessage('Surname is required')
        .isLength({ min: 2, max: 100 }).withMessage('Surname must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Surname can only contain letters, spaces, hyphens, and apostrophes'),

    // 3. Email - Database: email (VARCHAR 150, UNIQUE)
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail()
        .isLength({ max: 150 }).withMessage('Email must be less than 150 characters'),

    // 4. Phone Number - Database: phone_number (VARCHAR 20)
    //  FIXED: Supports both local and international formats
    body('phone_number')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .custom((value) => {
            // Remove spaces, dashes, and parentheses
            let cleaned = value.replace(/[\s\-\(\)]/g, '');
            
            // South African phone number patterns
            // Local: 0821234567 (10 digits, starts with 0)
            // International with +: +27821234567 (starts with +27)
            // International without +: 27821234567 (starts with 27)
            const localPattern = /^0\d{9}$/;                    // 0821234567
            const intlWithPlusPattern = /^\+\d{11}$/;           // +27821234567
            const intlWithoutPlusPattern = /^27\d{9}$/;         // 27821234567
            
            // Check if it matches any pattern
            const isValid = localPattern.test(cleaned) || 
                           intlWithPlusPattern.test(cleaned) || 
                           intlWithoutPlusPattern.test(cleaned);
            
            if (!isValid) {
                // Additional check: after removing non-digits, should be 10 or 11 digits
                const digitsOnly = cleaned.replace(/\D/g, '');
                if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
                    return true;
                }
                if (digitsOnly.length === 11 && digitsOnly.startsWith('27')) {
                    return true;
                }
                throw new Error('Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)');
            }
            
            // Validate length after removing non-digits
            const digitsOnly = cleaned.replace(/\D/g, '');
            if (digitsOnly.length !== 10 && digitsOnly.length !== 11) {
                throw new Error('Phone number must be 10 or 11 digits');
            }
            
            return true;
        }),

    // 5. Gender ID - Database: gender_id (INT, FOREIGN KEY)
    body('gender_id')
        .notEmpty().withMessage('Gender is required')
        .isInt({ min: 1, max: 4 }).withMessage('Invalid gender selection')
        .custom((value) => {
            const validGenders = [1, 2, 3, 4]; // 1=Male, 2=Female, 3=Other, 4=Prefer not to say
            if (!validGenders.includes(parseInt(value))) {
                throw new Error('Invalid gender selection');
            }
            return true;
        }),

    // 6. ID Number - Database: id_number (VARCHAR 20, UNIQUE)
    body('id_number')
        .trim()
        .notEmpty().withMessage('ID/Passport number is required')
        .isLength({ min: 13, max: 13 }).withMessage('South African ID must be exactly 13 digits')
        .matches(/^\d{13}$/).withMessage('ID must contain only numbers')
        .custom((value) => {
            // Luhn algorithm for South African ID validation
            let sum = 0;
            let alternate = false;
            for (let i = value.length - 1; i >= 0; i--) {
                let n = parseInt(value.charAt(i));
                if (alternate) {
                    n *= 2;
                    if (n > 9) {
                        n = (n % 10) + 1;
                    }
                }
                sum += n;
                alternate = !alternate;
            }
            if (sum % 10 !== 0) {
                throw new Error('Invalid South African ID number');
            }
            return true;
        }),

    // 7. Password - Will be hashed as password_hash
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .isLength({ max: 50 }).withMessage('Password must be less than 50 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),

    // 8. Confirm Password - Validation only (not stored)
    body('confirmPassword')
        .notEmpty().withMessage('Please confirm your password')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),

    // 9. Terms Accepted - Database: terms_accepted (BOOLEAN)
    body('terms_accepted')
        .isBoolean().withMessage('Invalid terms agreement')
        .custom(value => value === true)
        .withMessage('You must agree to the Terms of Service')
];

// ===== LOGIN VALIDATION =====
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// ===== OTP VALIDATION =====
const validateOTP = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('otpCode')
        .notEmpty().withMessage('OTP code is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
        .matches(/^\d{6}$/).withMessage('OTP must contain only numbers')
];

// ===== RESEND OTP VALIDATION =====
const validateResendOTP = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail()
];

// ===== UPDATE PROFILE VALIDATION =====
const validateUpdateProfile = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

    body('surname')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Surname must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Surname can only contain letters, spaces, hyphens, and apostrophes'),

    body('phone_number')
        .optional()
        .trim()
        .custom((value) => {
            let cleaned = value.replace(/[\s\-\(\)]/g, '');
            
            // South African phone number patterns
            const localPattern = /^0\d{9}$/;                    // 0821234567
            const intlWithPlusPattern = /^\+\d{11}$/;           // +27821234567
            const intlWithoutPlusPattern = /^27\d{9}$/;         // 27821234567
            
            const isValid = localPattern.test(cleaned) || 
                           intlWithPlusPattern.test(cleaned) || 
                           intlWithoutPlusPattern.test(cleaned);
            
            if (!isValid) {
                const digitsOnly = cleaned.replace(/\D/g, '');
                if ((digitsOnly.length === 10 && digitsOnly.startsWith('0')) ||
                    (digitsOnly.length === 11 && digitsOnly.startsWith('27'))) {
                    return true;
                }
                throw new Error('Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)');
            }
            return true;
        }),

    body('gender_id')
        .optional()
        .isInt({ min: 1, max: 4 }).withMessage('Invalid gender selection')
];

// ===== CHANGE PASSWORD VALIDATION =====
const validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('New password must contain uppercase, lowercase, number, and special character'),

    body('confirmNewPassword')
        .notEmpty().withMessage('Please confirm your new password')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match')
];

// ===== FORGOT PASSWORD VALIDATION =====
const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail()
];

// ===== RESET PASSWORD VALIDATION =====
const validateResetPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),

    body('otpCode')
        .notEmpty().withMessage('OTP code is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
        .matches(/^\d{6}$/).withMessage('OTP must contain only numbers'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),

    body('confirmNewPassword')
        .notEmpty().withMessage('Please confirm your new password')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match')
];

module.exports = {
    validateSignup,
    validateLogin,
    validateOTP,
    validateResendOTP,
    validateUpdateProfile,
    validateChangePassword,
    validateForgotPassword,
    validateResetPassword
};