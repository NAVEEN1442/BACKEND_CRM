const express = require('express');
const router = express.Router();

const { 
  createQuestion, 
  assignQuestionToPatient,
  getDoctorQuestions,
  updateQuestionStatus,
  getPatientQuestions,
  getAssignedQuestionsForPatientByDoctor
} = require('../controllers/questionController');
const {verifyToken, isDoctor} = require('../middleware/authMiddleware');


router.post('/upload-question', verifyToken, isDoctor, createQuestion);
router.post('/assign', verifyToken, isDoctor, assignQuestionToPatient);
router.get('/', verifyToken, isDoctor, getDoctorQuestions);
router.get('/patient', verifyToken, getPatientQuestions);
router.get('/:patientId', verifyToken, getAssignedQuestionsForPatientByDoctor);
router.put('/update-status', verifyToken, isDoctor, updateQuestionStatus);

module.exports = router;
