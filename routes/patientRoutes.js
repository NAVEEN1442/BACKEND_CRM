const express = require('express');
const router = express.Router();
const { updateTherapist } = require('../controllers/patientController');
const { verifyToken } = require('../middleware/authMiddleware');


router.patch('/assign-therapist', verifyToken, updateTherapist);

module.exports = router;
