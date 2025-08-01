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

exports.getDoctorQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ created_by: req.user.id });

        res.status(200).json({ success: true, data: questions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.assignQuestionToPatient = async (req, res) => {
  try {
    const { patient_id, question_id } = req.body;

    // Check if the question is already assigned to this patient
    const existingAssignment = await PatientQuestionAssignment.findOne({ patient_id, question_id });
    if (existingAssignment) {
      return res.status(400).json({ success: false, message: "Question already assigned to this patient" });
    }

    const assignment = await PatientQuestionAssignment.create({
      patient_id,
      question_id,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

exports.updateQuestionStatus = async (req, res) => {
  try {
    const { assignment_id, status } = req.body;

    if (!assignment_id || !status) {
      return res.status(400).json({ success: false, message: "Assignment ID and status are required" });
    }

    const assignment = await PatientQuestionAssignment.findById(assignment_id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    assignment.status = status;
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getPatientQuestions = async (req, res) => {
    try {
        const patientId = req.user._id;

        const assignments = await PatientQuestionAssignment.find({ patient_id: patientId })
            .populate('question_id');

        const questions = assignments.map((a) => ({
            assignment_id: a._id, 
            question_id: a.question_id._id,
            question_text: a.question_id.question_text,
            is_global: a.question_id.is_global,
            status: a.status,
            assignedAt: a.assignedAt,
        }));

        res.status(200).json({ success: true, data: questions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAssignedQuestionsForPatientByDoctor = async (req, res) => {
    try {
        const { patientId } = req.params;

        const assignments = await PatientQuestionAssignment.find({ patient_id: patientId })
            .populate('question_id');

        if (assignments.length === 0) {
            return res.status(404).json({ success: false, message: "No questions found for this patient" });
        }

        const questions = assignments.map((a) => ({
            assignment_id: a._id,
            question_id: a.question_id._id,
            question_text: a.question_id.question_text,
            is_global: a.question_id.is_global,
            status: a.status,
            assigned_at: a.assignedAt,
            completed_at: a.completed_at,
        }));

        res.status(200).json({ success: true, data: questions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}