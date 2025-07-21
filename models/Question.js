const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_text: {
    type: String,
    required: true,
  },
  is_global: {
    type: Boolean,
    default: false, // false = custom question
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // usually doctor
    required: function () {
      return !this.is_global;
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Question', questionSchema);
