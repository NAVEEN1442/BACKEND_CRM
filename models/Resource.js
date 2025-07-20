const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  file_url: { type: String }, // Cloud URL or external URL
  file_type: { 
    type: String, 
    enum: ['pdf', 'image', 'video', 'url'], 
    required: true 
  },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_global: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);
