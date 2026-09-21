const express = require('express');
const router = express.Router();
const {
    createProgramme,
    getAllProgrammes,
    getProgrammeById,
    updateProgramme,
    deleteProgramme,
    archiveProgramme,
    unarchiveProgramme
} = require('../controllers/programmeController');

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

// Archive / unarchive (status-only flip, no start-date validation)
router.patch('/programmes/:id/archive', archiveProgramme);
router.patch('/programmes/:id/unarchive', unarchiveProgramme);

module.exports = router;