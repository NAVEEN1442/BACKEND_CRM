
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionLevels = ['read-only', 'contribute', 'full'];

const accessLogSchema = new Schema({
  who: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  when: {
    type: Date,
    default: Date.now,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
});

const patientProfileAccessSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  sharedWithDoctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  sharingDoctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  permissionLevel: {
    type: String,
    enum: permissionLevels,
    required: true,
    default: 'read-only',
  },
  accessLogs: [accessLogSchema],
}, {
  timestamps: true,
});

const PatientProfileAccess = mongoose.model('PatientProfileAccess', patientProfileAccessSchema);

module.exports = PatientProfileAccess;
