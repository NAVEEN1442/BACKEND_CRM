const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Role-based access control middleware placeholder
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// POST /api/payments - create payment (admin, staff)
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'staff'),
  paymentController.createPayment
);

// GET /api/payments - list payments (admin, doctor, patient)
router.get(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'doctor', 'patient'),
  paymentController.getPayments
);

// GET /api/payments/:id - get payment details (admin, doctor, patient)
router.get(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'doctor', 'patient'),
  paymentController.getPaymentById
);

// PUT /api/payments/:id - update payment (admin, staff)
router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('admin', 'staff'),
  paymentController.updatePayment
);

module.exports = router;
