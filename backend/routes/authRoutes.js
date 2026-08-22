// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { 
    registerValidation, 
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} = require('../validations/authValidation');


// PUBLIC ROUTES (No authentication required)


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user and get JWT token
 * @access Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route GET /api/auth/verify/:token
 * @desc Verify email with token
 * @access Public
 */
router.get('/verify/:token', authController.verifyEmail);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend verification email
 * @access Public
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset link
 * @access Public
 */
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);


// PROTECTED ROUTES (Authentication required)


/**
 * @route GET /api/auth/me
 * @desc Get current logged-in user
 * @access Private (requires JWT)
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client removes token)
 * @access Private (requires JWT)
 */
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;