const mongoose = require('mongoose');

// Payment model schema
const paymentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  invoiceId: { type: String, unique: true, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  service: { type: String, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer'], required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false }
});

// Indexes for performance
paymentSchema.index({ patientId: 1, doctorId: 1, invoiceId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ doctorId: 1 });
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ invoiceId: 1 });

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
