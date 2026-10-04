// backend/routes/learnerRoutes.js
const express = require('express');
const router = express.Router();
const learnerController = require('../controllers/learnerController');
const digitalCenterController = require('../controllers/digitalCenterController');
const { getPrefs, setPrefs } = require('../utils/notificationPrefs');

const { authenticate, isLearner } = require('../middleware/auth');

// ============================================
// DEBUG: log all requests
// ============================================
router.use((req, res, next) => {
    console.log(
        `${req.method} ${req.path} - Auth header:`,
        req.headers.authorization ? 'present' : 'missing'
    );
    next();
});

// ============================================
// All routes require authentication.
// isLearner is applied per-route below — NOT globally — so admins
// can still fetch /digital-centers when registering staff.
// ============================================
router.use(authenticate);

// ============================================
// DIGITAL CENTRES — accessible to any authenticated user
// (both learners picking a centre, and admins assigning one)
// ============================================

router.get('/digital-centers', digitalCenterController.getAllCenters);
router.get('/digital-centers/nearest', digitalCenterController.getNearestCenters);

// ============================================
// LEARNER-ONLY ROUTES
// isLearner returns 404 for admins and any other role.
// ============================================

// Profile
router.get('/profile', isLearner, learnerController.getLearnerProfile);
router.put('/profile', isLearner, learnerController.updateLearnerProfile);
router.put('/change-password', isLearner, learnerController.changePassword);
router.get('/stats', isLearner, learnerController.getLearnerStats);

// Notification preferences
router.get('/notifications', isLearner, learnerController.getMyNotificationPrefs);
router.put('/notifications', isLearner, learnerController.updateMyNotificationPrefs);

// Interest in a centre
router.post('/digital-centers/interest', isLearner, digitalCenterController.submitInterest);
router.delete('/digital-centers/interest', isLearner, digitalCenterController.removeInterest);
router.get('/digital-centers/my-interests', isLearner, digitalCenterController.getMyCenterInterests);

// Programmes & interests
router.get('/programmes', isLearner, learnerController.getProgrammes);
router.post('/interest', isLearner, learnerController.recordInterest);
router.post('/express-interest', isLearner, learnerController.recordInterest);
router.get('/interests', isLearner, learnerController.getLearnerInterests);

// Certificates
router.get('/certificates', isLearner, learnerController.getMyCertificates);
router.get('/certificates/:certificateId/download', isLearner, learnerController.downloadMyCertificate);

// ============================================
// DEBUG ROUTES
// ============================================
router.get('/debug-token', authenticate, (req, res) => {
    console.log('Debug token route - User:', req.user);
    res.json({
        success: true,
        message: 'Token is valid!',
        user: req.user
    });
});

router.get('/public-test', (req, res) => {
    res.json({
        success: true,
        message: 'Public route is working! No token needed.'
    });
});

module.exports = router;