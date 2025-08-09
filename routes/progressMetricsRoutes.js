const express = require('express');
const router = express.Router();

const {
  createProgressMetrics,
  updateProgressMetric,
  getProgressReport
} = require('../controllers/progressMetricsController');

const { verifyToken, isDoctor, hasRole } = require('../middleware/authMiddleware');

// Create progress metrics (single or batch)
// POST /progress-metrics
router.post('/', verifyToken, isDoctor, createProgressMetrics);

// Update existing progress metric
// PATCH /progress-metrics/:id
router.patch('/:id', verifyToken, isDoctor, updateProgressMetric);

// Get progress report with flexible filtering
// GET /progress-report?patient=ID&type=metric_type&period=30d&format=chart
router.get('/report', verifyToken, hasRole('doctor', 'patient'), getProgressReport);

// Additional convenience routes for specific use cases

// Get all metrics for a specific patient (doctor access)
router.get('/patient/:patientId', verifyToken, isDoctor, async (req, res, next) => {
  req.query.patient = req.params.patientId;
  req.query.format = 'detailed';
  return getProgressReport(req, res, next);
});

// Get chart data for a specific metric type and patient
router.get('/chart/:patientId/:metricType', verifyToken, hasRole('doctor', 'patient'), async (req, res, next) => {
  req.query.patient = req.params.patientId;
  req.query.type = req.params.metricType;
  req.query.format = 'chart';
  return getProgressReport(req, res, next);
});

// Get patient's own progress data (patient access)
router.get('/my-progress', verifyToken, hasRole('patient'), async (req, res, next) => {
  // For patients, we need to find their patient record first
  try {
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ user_id: req.user.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }
    
    req.query.patient = patient._id.toString();
    req.query.format = req.query.format || 'detailed';
    return getProgressReport(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient profile',
      error: error.message
    });
  }
});

module.exports = router;
