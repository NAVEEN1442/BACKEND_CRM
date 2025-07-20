const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({

  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  specialization: { type: String },
  
  bio: { type: String }
});

module.exports = mongoose.model('Doctor', doctorSchema);
