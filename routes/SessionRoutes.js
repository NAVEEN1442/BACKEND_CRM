const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { verifyToken, isDoctor  } = require('../middleware/authMiddleware');

// Route to create a new session
router.post('/create', verifyToken, isDoctor, sessionController.createSession);
// Route to get patient timeline
router.get('/timeline', verifyToken, isDoctor, sessionController.getPatientTimeline);

router.get('/types', verifyToken, sessionController.getDoctorSessionTypes);

module.exports = router;