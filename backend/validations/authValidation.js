// backend/validations/authValidation.js
const { body } = require('express-validator');

// ============================================
// REGISTER VALIDATION
// ============================================

const registerValidation = [
    // Full Name
    body('fullName')
        .trim()
        .notEmpty().withMessage('Please enter your full name')
        .isLength({ min: 2, max: 200 }).withMessage('Full name must be between 2 and 200 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
    
    // Email
    body('email')
        .trim()
        .notEmpty().withMessage('Please enter your email address')
        .isEmail().withMessage('Please enter a valid email address (e.g., name@example.com)')
        .isLength({ max: 255 }).withMessage('Email address is too long (maximum 255 characters)')
        .normalizeEmail(),
    
    // Phone
    body('phone')
        .trim()
        .notEmpty().withMessage('Please enter your phone number')
        .isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits')
        .matches(/^[0-9]+$/).withMessage('Phone number can only contain numbers'),
    
    // ID Number
    body('idNumber')
        .trim()
        .notEmpty().withMessage('Please enter your ID or passport number')
        .isLength({ min: 13, max: 13 }).withMessage('South African ID number must be exactly 13 digits')
        .matches(/^[0-9]+$/).withMessage('ID number can only contain numbers'),
    
    // Gender
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Please select a valid gender option'),
    
    // Password
    body('password')
        .notEmpty().withMessage('Please create a password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .isLength({ max: 100 }).withMessage('Password is too long (maximum 100 characters)')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter (a-z)')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter (A-Z)')
        .matches(/\d/).withMessage('Password must contain at least one number (0-9)')
        .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@$!%*?&)')
        .custom((value) => {
            const commonPasswords = ['password', 'password123', '12345678', 'qwerty123', 'Password123'];
            if (commonPasswords.includes(value.toLowerCase())) {
                throw new Error('This password is too common. Please choose a stronger one');
            }
            return true;
        }),
    
    // Confirm Password
    body('confirmPassword')
        .notEmpty().withMessage('Please confirm your password')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match. Please re-enter'),
    
    // Terms
    body('agreeTerms')
        .isBoolean().withMessage('Terms must be a boolean value')
        .custom(value => value === true).withMessage('You must agree to the Terms of Service to continue')
];

// ============================================
// LOGIN VALIDATION
// ============================================

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Please enter your email address')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Please enter your password')
];

// ============================================
// FORGOT PASSWORD VALIDATION
// ============================================

const forgotPasswordValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Please enter your email address')
        .isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail()
];

// ============================================
// RESET PASSWORD VALIDATION
// ============================================

const resetPasswordValidation = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    
    body('password')
        .notEmpty().withMessage('Please create a new password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .isLength({ max: 100 }).withMessage('Password is too long (maximum 100 characters)')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter (a-z)')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter (A-Z)')
        .matches(/\d/).withMessage('Password must contain at least one number (0-9)')
        .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@$!%*?&)'),
    
    body('confirmPassword')
        .notEmpty().withMessage('Please confirm your new password')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match')
];

// ============================================
// UPDATE PROFILE VALIDATION (Optional)
// ============================================

const updateProfileValidation = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Full name must be between 2 and 200 characters')
        .matches(/^[a-zA-Z\s\-']+$/).withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits')
        .matches(/^[0-9]+$/).withMessage('Phone number can only contain numbers'),
    
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Please select a valid gender option')
];

// ============================================
// EXPORTS
// ============================================

module.exports = {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updateProfileValidation
};