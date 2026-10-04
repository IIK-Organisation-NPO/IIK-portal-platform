const express = require('express');
const router = express.Router();
const {
    createProgramme,
    getAllProgrammes,
    getProgrammeById,
    updateProgramme,
    deleteProgramme,
    archiveProgramme,
    unarchiveProgramme,
    getActiveProgrammeCentres,
    getCentreProgrammes,
    updateProgrammeCentreStatus,
    updateMyProgrammeCentreStatus        // ← ADD
} = require('../controllers/programmeController');

const { authenticate, isAdmin } = require('../middleware/auth');   // ← ADD

// Create a new programme (Draft or Publish)
router.post('/programmes', createProgramme);

// List all programmes
router.get('/programmes', getAllProgrammes);

// Get a single programme by ID
router.get('/programmes/:id', getProgrammeById);

// Update a programme (full update)
router.put('/programmes/:id', updateProgramme);

// Delete a programme
router.delete('/programmes/:id', deleteProgramme);

// Archive / unarchive (programme-level status)
router.patch('/programmes/:id/archive', archiveProgramme);
router.patch('/programmes/:id/unarchive', unarchiveProgramme);

// ---------------------------------------------------------------------------
// Programme ↔ Centre junction (per-pair archive)
// ---------------------------------------------------------------------------

// Learner: centres where this programme is Active
router.get('/programmes/:programmeId/centres', getActiveProgrammeCentres);

// Admin: every programme at a centre, with its pair status
router.get('/centres/:centreId/programmes', getCentreProgrammes);

// Admin: toggle a single (programme, centre) pair by explicit IDs
router.put('/programmes/:programmeId/centres/:centreId/status',updateProgrammeCentreStatus);

// Admin: archive/restore at MY OWN centre (resolved from the JWT)
// ← THIS IS THE ROUTE THAT WAS MISSING
router.put('/programmes/:programmeId/my-centre/status',authenticate, isAdmin,updateMyProgrammeCentreStatus);

module.exports = router;