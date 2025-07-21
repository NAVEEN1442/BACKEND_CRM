const Answer = require('../models/Answer');
const Patient = require('../models/Patient');
const PatientQuestionAssignment = require('../models/PatientQuestionAssignment');

const submitAnswer = async (req, res) => {
  try {
   
    const { question_id, answer_text } = req.body;
    const userId = req.user.id;


    const patient = await Patient.findOne({ user_id: userId });


    if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
    }

    const patient_id = patient._id.toString();



    if (!answer_text || answer_text.trim() === '') {
      return res.status(400).json({ message: 'Answer cannot be empty' });
    }

    console.log("question_id", question_id)
    console.log("patientId", patient_id)
    const assignment = await PatientQuestionAssignment.findOne({
      patient_id,
      question_id,
    });

    if (!assignment) {
      return res.status(403).json({ message: 'Question not assigned to this patient' });
    }

    const answer = new Answer({
      question_id,
      patient_id,
      answer_text,
    });

    await answer.save();
    return res.status(201).json({ message: 'Answer submitted', answer });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

const getPatientAnswerHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const answers = await Answer.find({ patient_id }).populate('question_id', 'question_text');
    return res.status(200).json({ answers });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

const getAnswersByQuestion = async (req, res) => {
  try {
    const { question_id } = req.params;

    const answers = await Answer.find({ question_id }).populate('patient_id', 'full_name');
    return res.status(200).json({ answers });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  submitAnswer,
  getPatientAnswerHistory,
  getAnswersByQuestion,
};
