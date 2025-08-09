const ProgressMetric = require('../models/ProgressMetric');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Joi = require('joi');

// Validation schema for progress metrics
const progressMetricSchema = Joi.object({
  patient_id: Joi.string().required(),
  metric_type: Joi.string().valid(
    'anxiety', 'depression', 'mood', 'energy', 'sleep_quality', 
    'stress', 'focus', 'motivation', 'social_interaction', 
    'self_esteem', 'therapy_engagement', 'medication_adherence',
    'physical_activity', 'emotional_regulation', 'cognitive_function'
  ).required(),
  metric_value: Joi.number().min(0).max(10).required(),
  measurement_date: Joi.date().default(Date.now),
  notes: Joi.string().max(500).allow('', null),
  session_id: Joi.string().optional(),
  assessment_method: Joi.string().valid('self_report', 'clinical_observation', 'standardized_test', 'questionnaire').default('clinical_observation')
});

const updateMetricSchema = Joi.object({
  metric_value: Joi.number().min(0).max(10).optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
  assessment_method: Joi.string().valid('self_report', 'clinical_observation', 'standardized_test', 'questionnaire').optional()
});

/**
 * @route POST /progress-metrics
 * @desc Create new progress metrics (single or batch)
 * @access Private (Doctor only)
 */
const createProgressMetrics = async (req, res) => {
  try {
    const doctor_id = req.user.id;
    
    // Check if request is for single metric or batch
    const isArray = Array.isArray(req.body);
    const metricsData = isArray ? req.body : [req.body];
    
    const createdMetrics = [];
    const errors = [];
    
    for (let i = 0; i < metricsData.length; i++) {
      const metricData = metricsData[i];
      
      try {
        // Validate input
        const { error, value } = progressMetricSchema.validate(metricData);
        if (error) {
          errors.push({
            index: i,
            error: error.details[0].message
          });
          continue;
        }
        
        // Verify patient exists and is assigned to this doctor
        const patient = await Patient.findById(value.patient_id);
        if (!patient) {
          errors.push({
            index: i,
            error: 'Patient not found'
          });
          continue;
        }
        
        // Verify doctor has access to this patient
        if (patient.therapist_id?.toString() !== doctor_id) {
          errors.push({
            index: i,
            error: 'Access denied - Patient not assigned to this doctor'
          });
          continue;
        }
        
        // Create progress metric
        const progressMetric = new ProgressMetric({
          ...value,
          doctor_id
        });
        
        await progressMetric.save();
        createdMetrics.push(progressMetric);
        
      } catch (err) {
        errors.push({
          index: i,
          error: err.message
        });
      }
    }

    // Early return if no metrics were created
    if (createdMetrics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No metrics were created',
        errors
      });
    }

    const response = {
      success: true,
      message: `${createdMetrics.length} metric(s) created successfully`,
      data: isArray ? createdMetrics : createdMetrics[0]
    };
    
    if (errors.length > 0) {
      response.warnings = errors;
    }
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Create progress metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating progress metrics',
      error: error.message
    });
  }
};

/**
 * @route PATCH /progress-metrics/:id
 * @desc Update existing progress metric
 * @access Private (Doctor only)
 */
const updateProgressMetric = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor_id = req.user.id;
    
    // Validate input
    const { error, value } = updateMetricSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    // Find the metric and verify ownership
    const progressMetric = await ProgressMetric.findById(id);
    if (!progressMetric) {
      return res.status(404).json({
        success: false,
        message: 'Progress metric not found'
      });
    }
    
    if (progressMetric.doctor_id.toString() !== doctor_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only update metrics you created'
      });
    }
    
    // Update the metric
    Object.assign(progressMetric, value);
    await progressMetric.save();
    
    res.status(200).json({
      success: true,
      message: 'Progress metric updated successfully',
      data: progressMetric
    });
    
  } catch (error) {
    console.error('Update progress metric error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating progress metric',
      error: error.message
    });
  }
};

/**
 * @route GET /progress-report?patient=ID&type=metric_type&period=30d&format=chart
 * @desc Get comprehensive progress report for a patient
 * @access Private (Doctor/Patient)
 */
const getProgressReport = async (req, res) => {
  try {
    const {
      patient: patientId,
      type: metricType,
      period = '30d',
      format = 'detailed',
      startDate,
      endDate
    } = req.query;
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }
    
    // Verify access permissions
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check access: doctors can see their patients, patients can see their own data
    let hasAccess = false;
    if (userRole === 'doctor') {
      hasAccess = patient.therapist_id?.toString() === userId;
    } else if (userRole === 'patient') {
      hasAccess = patient.user_id.toString() === userId;
    }
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Parse period (e.g., '30d', '3m', '1y')
      const now = new Date();
      const periodMatch = period.match(/^(\d+)([dmy])$/);
      if (periodMatch) {
        const [, amount, unit] = periodMatch;
        const numAmount = parseInt(amount);
        
        switch (unit) {
          case 'd':
            dateFilter.$gte = new Date(now.setDate(now.getDate() - numAmount));
            break;
          case 'm':
            dateFilter.$gte = new Date(now.setMonth(now.getMonth() - numAmount));
            break;
          case 'y':
            dateFilter.$gte = new Date(now.setFullYear(now.getFullYear() - numAmount));
            break;
        }
      } else {
        // Default to 30 days
        dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
    }
    
    // Build query filter
    const filter = {
      patient_id: patientId,
      measurement_date: dateFilter
    };
    
    if (metricType) {
      filter.metric_type = metricType;
    }
    
    // Get metrics data
    const metrics = await ProgressMetric.find(filter)
      .populate('doctor_id', 'user_id')
      .populate({
        path: 'doctor_id',
        populate: {
          path: 'user_id',
          select: 'full_name'
        }
      })
      .sort({ measurement_date: -1 })
      .lean();
    
    if (metrics.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No progress data found for the specified criteria',
        data: {
          metrics: [],
          summary: {},
          chartData: []
        }
      });
    }
    
    // Process data based on format
    let responseData;
    
    if (format === 'chart') {
      responseData = await generateChartData(metrics, metricType);
    } else {
      responseData = await generateDetailedReport(metrics, patientId, metricType);
    }
    
    res.status(200).json({
      success: true,
      data: responseData,
      metadata: {
        totalRecords: metrics.length,
        dateRange: {
          start: dateFilter.$gte,
          end: dateFilter.$lte || new Date()
        },
        patient: patientId,
        metricType: metricType || 'all'
      }
    });
    
  } catch (error) {
    console.error('Get progress report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating progress report',
      error: error.message
    });
  }
};

// Helper function to generate chart-friendly data
async function generateChartData(metrics, metricType) {
  const chartData = {};
  
  // Group by metric type
  metrics.forEach(metric => {
    if (!chartData[metric.metric_type]) {
      chartData[metric.metric_type] = {
        label: metric.metric_type.replace('_', ' ').toUpperCase(),
        data: []
      };
    }
    
    chartData[metric.metric_type].data.push({
      x: metric.measurement_date,
      y: metric.metric_value,
      severity: metric.severity_level,
      notes: metric.notes,
      assessmentMethod: metric.assessment_method
    });
  });
  
  // Sort data points by date for each metric type
  Object.keys(chartData).forEach(type => {
    chartData[type].data.sort((a, b) => new Date(a.x) - new Date(b.x));
  });
  
  return {
    chartData: Object.values(chartData),
    format: 'time-series'
  };
}

// Helper function to generate detailed report
async function generateDetailedReport(metrics, patientId, metricType) {
  // Group metrics by type for analysis
  const metricsByType = {};
  metrics.forEach(metric => {
    if (!metricsByType[metric.metric_type]) {
      metricsByType[metric.metric_type] = [];
    }
    metricsByType[metric.metric_type].push(metric);
  });
  
  // Calculate summary statistics
  const summary = {};
  Object.keys(metricsByType).forEach(type => {
    const typeMetrics = metricsByType[type];
    const values = typeMetrics.map(m => m.metric_value);
    
    summary[type] = {
      current: values[0], // Most recent (metrics are sorted desc)
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      trend: calculateTrend(typeMetrics),
      totalMeasurements: values.length,
      lastMeasurement: typeMetrics[0].measurement_date
    };
  });
  
  return {
    metrics: metrics.slice(0, 50), // Limit for performance
    summary,
    chartData: await generateChartData(metrics, metricType)
  };
}

// Helper function to calculate trend
function calculateTrend(metrics) {
  if (metrics.length < 2) return 'insufficient_data';
  
  const recent = metrics.slice(0, Math.min(5, metrics.length));
  const older = metrics.slice(-Math.min(5, metrics.length));
  
  const recentAvg = recent.reduce((sum, m) => sum + m.metric_value, 0) / recent.length;
  const olderAvg = older.reduce((sum, m) => sum + m.metric_value, 0) / older.length;
  
  const diff = recentAvg - olderAvg;
  const threshold = 0.5;
  
  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
}

module.exports = {
  createProgressMetrics,
  updateProgressMetric,
  getProgressReport
};
