const express = require('express');
const router = express.Router();

const {
  submitAnswer,
  getPatientAnswerHistory,
  getAnswersByQuestion,
} = require('../controllers/answerController');

const {
  verifyToken,
  isPatient,
} = require('../middleware/authMiddleware');

router.post('/submit-answer', verifyToken, isPatient, submitAnswer);
router.get('/history/:patient_id', verifyToken, isPatient, getPatientAnswerHistory);
router.get('/question/:question_id', verifyToken, isPatient, getAnswersByQuestion);

module.exports = router;
