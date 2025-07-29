const express = require('express');
const router = express.Router();
const { updateTherapist, getPatientHistory, savePatientHistory } = require('../controllers/patientController');
const { verifyToken } = require('../middleware/authMiddleware');


router.patch('/assign-therapist', verifyToken, updateTherapist);
router.get('/:id/history', verifyToken, getPatientHistory);
router.post('/:id/history', verifyToken, savePatientHistory);

module.exports = router;
