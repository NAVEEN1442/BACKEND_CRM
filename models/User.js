const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },

  password_hash: { type: String, required: true },

  role: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },

  full_name: { type: String },

  created_at: { type: Date, default: Date.now }
  
});

module.exports = mongoose.model('User', userSchema);
