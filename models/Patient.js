const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({

  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  date_of_birth: { type: Date },

  gender: { type: String },

  therapist_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: false }


});

module.exports = mongoose.model('Patient', patientSchema);
