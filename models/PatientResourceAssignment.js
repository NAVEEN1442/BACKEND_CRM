const mongoose = require('mongoose');

const patientResourceAssignmentSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  assigned_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PatientResourceAssignment', patientResourceAssignmentSchema);
