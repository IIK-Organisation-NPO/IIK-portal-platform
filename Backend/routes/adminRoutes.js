// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const upload = require('../config/upload');

// ===== ADMIN ROUTES =====

// Dashboard Routes
router.get('/stats', AdminController.getStats);
router.get('/activities', AdminController.getActivities);

// Learner Routes
router.get('/learners', AdminController.getLearners);
router.put('/learners/:id', AdminController.updateLearner);
router.delete('/learners/:id', AdminController.deleteLearner);

// ===== INTERESTED LEARNERS ROUTES =====
router.get('/interested-learners', AdminController.getInterestedLearners);
router.put('/interested-learners/:id', AdminController.updateInterestedLearnerStatus);

// ===== PROGRAMME INTEREST COUNTS =====
router.get('/programme-interest-counts', AdminController.getProgrammeInterestCounts);

// ===== BULK EMAIL =====
router.post('/send-bulk-email', AdminController.sendBulkEmail);

// Programme Routes
router.get('/programmes', AdminController.getProgrammes);

// ============================================
// ✅ CERTIFICATE ROUTES
// ============================================

// Get all certificates
router.get('/certificates', AdminController.getCertificates);

// Upload certificate with file (PDF, JPEG, PNG)
router.post('/certificates/upload', upload.single('certificateFile'), AdminController.uploadCertificate);

// ✅ VIEW certificate (displays in browser) - NEW
router.get('/certificates/view/:id', AdminController.viewCertificate);

// update
router.put('/certificates/:id', AdminController.updateCertificate);

// Download certificate
router.get('/certificates/download/:id', AdminController.downloadCertificate);

// Delete certificate
router.delete('/certificates/:id', AdminController.deleteCertificate);

// ============================================
// ✅ ANALYTICS ROUTES
// ============================================

// Get complete analytics data (stats, gender, age)
router.get('/analytics', AdminController.getAnalytics);

// Get centre statistics (learners per digital centre)
router.get('/analytics/centres', AdminController.getCentreStats);

// Get programme statistics (enrolment & completion per programme)
router.get('/analytics/programmes', AdminController.getProgrammeStats);

// ============================================
// ✅ BULK CERTIFICATE ROUTES
// ============================================

// Get eligible learners for bulk certificates
router.get('/bulk-certificates/eligible', AdminController.getEligibleLearners);

// Bulk issue certificates
router.post('/bulk-certificates/issue', AdminController.bulkIssueCertificates);

// ============================================
// ✅ TEST ROUTE
// ============================================
router.get('/test-certificate', async (req, res) => {
    try {
        const CertificateService = require('../services/certificateService');
        const pdfBytes = await CertificateService.generateCertificate({
            learnerName: 'Siphoh Xulu',
            idNumber: '9001011234089',
            completionDate: new Date(),
            programmeName: 'Digital Literacy',
            certificateNumber: 'TEST-001'
        });
        
        console.log(' Test PDF generated, size:', pdfBytes.length, 'bytes');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="test-certificate.pdf"');
        res.setHeader('Content-Length', pdfBytes.length);
        res.send(pdfBytes);
    } catch (error) {
        console.error(' Test error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;