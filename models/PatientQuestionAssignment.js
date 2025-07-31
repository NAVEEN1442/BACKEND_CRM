const mongoose = require('mongoose');

const patientQuestionAssignmentSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending','completed'],
    default: 'pending',
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  }
});

patientQuestionAssignmentSchema.index({ patient_id: 1, question_id: 1 }, { unique: true }); // Prevent duplicates

module.exports = mongoose.model('PatientQuestionAssignment', patientQuestionAssignmentSchema);
