const express = require('express');
const router = express.Router();

const { createNote, getPatientNotes } = require('../controllers/notesController');
// Middleware to protect routes
const { verifyToken, isDoctor } = require('../middleware/authMiddleware');

// Route to create a note
router.post('/',verifyToken , isDoctor, createNote);

// Route to get notes for a specific patient
router.get('/:patient_id', verifyToken, getPatientNotes);

module.exports = router;