const Question = require('../models/Question');
const PatientQuestionAssignment = require('../models/PatientQuestionAssignment');
const Patient = require('../models/Patient');

// Add a new question
exports.createQuestion = async (req, res) => {
  try {
    const { question_text, is_global } = req.body;
    

    const question = await Question.create({
      question_text,
      is_global: is_global ?? false,
      created_by: req.user.id,
      created_at: new Date(),
    });

  

    res.status(201).json({ success: true, data: question });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Assign a question to a patient
exports.assignQuestionToPatient = async (req, res) => {
  try {
    const { patient_id, question_id } = req.body;

    // Check for duplicate assignment
    const existing = await PatientQuestionAssignment.findOne({
      patient_id,
      question_id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Question already assigned to this patient',
      });
    }

    const assignment = await PatientQuestionAssignment.create({
      patient_id,
      question_id,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPatientQuestions = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from token

    // 1. Find the patient linked to this user
    const patient = await Patient.findOne({ user: userId });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // 2. Use the patient's _id to fetch assignments
    const assignments = await PatientQuestionAssignment.find({ patient_id: patient._id }).populate('question_id');

    const questions = assignments.map((a) => ({
      _id: a.question_id._id,
      question_text: a.question_id.question_text,
      is_global: a.question_id.is_global,
    }));

    console.log("questions", questions);

    res.status(200).json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};