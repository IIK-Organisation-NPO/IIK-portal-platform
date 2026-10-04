// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const upload = require('../config/upload');
const { authenticate, isAdmin } = require('../middleware/auth');


router.use(authenticate, isAdmin);

// ============================================
// DASHBOARD
// ============================================
router.get('/stats', AdminController.getStats);
router.get('/activities', AdminController.getActivities);

// ============================================
// LEARNER ROUTES
// ============================================
router.get('/learners', AdminController.getLearners);
router.put('/learners/:id', AdminController.updateLearner);
router.delete('/learners/:id', AdminController.deleteLearner);

// Completed programmes for a specific learner
// (used to populate the Programme dropdown when issuing a certificate)
router.get('/learners/:id/completed-programmes',AdminController.getLearnerCompletedProgrammes);

// ============================================
// INTERESTED LEARNERS
// ============================================
router.get('/interested-learners', AdminController.getInterestedLearners);
router.put('/interested-learners/:id', AdminController.updateInterestedLearnerStatus);

// ============================================
// PROGRAMME INTEREST COUNTS
// ============================================
router.get('/programme-interest-counts', AdminController.getProgrammeInterestCounts);

// ============================================
// BULK EMAIL
// ============================================
router.post('/send-bulk-email', AdminController.sendBulkEmail);

// ============================================
// PROGRAMMES
// ============================================
router.get('/programmes', AdminController.getProgrammes);


// ============================================
// CERTIFICATES
// ============================================
// List all certificates
router.get('/certificates', AdminController.getCertificates);
// Upload a certificate PDF (multipart, field name: certificateFile)
router.post('/certificates/upload',upload.single('certificateFile'),AdminController.uploadCertificate);
// View a certificate inline in the browser
router.get('/certificates/view/:id', AdminController.viewCertificate);
// Update certificate details
router.put('/certificates/:id', AdminController.updateCertificate);
// Download certificate as attachment
router.get('/certificates/download/:id', AdminController.downloadCertificate);
// Delete a certificate
router.delete('/certificates/:id', AdminController.deleteCertificate);



// ============================================
// ANALYTICS
// ============================================
// Overall stats, gender split, age groups
router.get('/analytics', AdminController.getAnalytics);

// Learners per digital centre
router.get('/analytics/centres', AdminController.getCentreStats);
router.get('/analytics/programmes', AdminController.getProgrammeStats);

// ============================================
// BULK CERTIFICATES
// ============================================
router.get('/bulk-certificates/eligible', AdminController.getEligibleLearners);
router.post('/bulk-certificates/issue',upload.single('template'),AdminController.bulkUploadCertificates);

// ============================================
// ENROLMENTS
// ============================================
router.patch('/enrolments/:id/complete',AdminController.markEnrolmentComplete);

// ============================================
// WEEKLY SUMMARY
// ============================================
router.post( '/weekly-summary/send-now', AdminController.sendWeeklySummaryNow);

// ============================================
// DEVELOPMENT-ONLY TEST ROUTES

// ============================================
if (process.env.NODE_ENV === 'development') {
    router.get('/test-certificate', async (req, res) => {
        try {
            const CertificateService = require('../services/certificateService');
            const pdfBytes = await CertificateService.generateCertificate({
                learnerName: 'Sipho Xulu',
                idNumber: '9001011234089',
                completionDate: new Date(),
                programmeName: 'Digital Literacy',
                certificateNumber: 'TEST-001'
            });

            console.log('Test PDF generated, size:', pdfBytes.length, 'bytes');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="test-certificate.pdf"');
            res.setHeader('Content-Length', pdfBytes.length);
            res.send(pdfBytes);
        } catch (error) {
            console.error('Test certificate error:', error);
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = router;