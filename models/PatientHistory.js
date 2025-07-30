const mongoose = require('mongoose');

// Patient History Schema
const patientHistorySchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  history_text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PatientHistory', patientHistorySchema);
