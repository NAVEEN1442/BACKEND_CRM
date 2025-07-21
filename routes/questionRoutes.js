const express = require('express');
const router = express.Router();

const { 
  createQuestion, 
  assignQuestionToPatient, 
   
} = require('../controllers/questionController');
const { getPatientQuestions } = require('../controllers/questionController');

const {verifyToken} = require('../middleware/authMiddleware');
const {isDoctor} = require('../middleware/authMiddleware');

router.post('/upload-question', verifyToken, isDoctor, createQuestion);
router.post('/assign-question', verifyToken, isDoctor, assignQuestionToPatient);
router.get('/:patient_id/questions', verifyToken, getPatientQuestions);

module.exports = router;
