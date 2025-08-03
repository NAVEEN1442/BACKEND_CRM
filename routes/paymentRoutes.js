const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware'); // ✅ fixed

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

router.post(
  '/',
  verifyToken,                         // ✅ use the correct function
  authorizeRoles('admin', 'staff'),
  paymentController.createPayment
);

router.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'doctor', 'patient'),
  paymentController.getPayments
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'doctor', 'patient'),
  paymentController.getPaymentById
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin', 'staff'),
  paymentController.updatePayment
);

module.exports = router;
