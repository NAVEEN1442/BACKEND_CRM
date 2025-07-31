const Payment = require('../models/Payment');
const Joi = require('joi');

// Validation schema for payment data
const paymentSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().required(),
  invoiceId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('INR'),
  service: Joi.string().required(),
  paymentDate: Joi.date().required(),
  paymentMethod: Joi.string().valid('Cash', 'UPI', 'Card', 'Bank Transfer').required(),
  status: Joi.string().valid('Pending', 'Paid', 'Failed').default('Paid'),
  notes: Joi.string().allow('', null),
  createdBy: Joi.string().optional()
});

// Create a new payment
exports.createPayment = async (req, res, next) => {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const payment = new Payment(value);
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// Get list of payments with filters and pagination
exports.getPayments = async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      fromDate,
      toDate,
      status,
      paymentMethod,
      page = 1,
      limit = 20,
      sortBy = 'paymentDate',
      sortOrder = 'desc'
    } = req.query;

    const filter = { deleted: false };

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (fromDate || toDate) {
      filter.paymentDate = {};
      if (fromDate) filter.paymentDate.$gte = new Date(fromDate);
      if (toDate) filter.paymentDate.$lte = new Date(toDate);
    }

    const payments = await Payment.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    const total = await Payment.countDocuments(filter);

    res.json({
      data: payments,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    next(err);
  }
};

// Get payment details by ID
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, deleted: false })
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// Update payment by ID
exports.updatePayment = async (req, res, next) => {
  try {
    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      value,
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (err) {
    next(err);
  }
};
