const mongoose = require('mongoose');

const progressMetricSchema = new mongoose.Schema({
  patient_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  metric_type: { 
    type: String, 
    required: true,
    enum: [
      'anxiety', 'depression', 'mood', 'energy', 'sleep_quality', 
      'stress', 'focus', 'motivation', 'social_interaction', 
      'self_esteem', 'therapy_engagement', 'medication_adherence',
      'physical_activity', 'emotional_regulation', 'cognitive_function'
    ]
  },
  metric_value: { 
    type: Number, 
    required: true,
    min: 0,
    max: 10
  },
  measurement_date: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  notes: { 
    type: String,
    maxlength: 500
  },
  session_id: { 
    type: String
  },
  assessment_method: {
    type: String,
    enum: ['self_report', 'clinical_observation', 'standardized_test', 'questionnaire'],
    default: 'clinical_observation'
  },
  severity_level: {
    type: String,
    enum: ['minimal', 'mild', 'moderate', 'severe', 'extreme']
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'progress_metrics'
});

// Compound indexes for efficient querying
progressMetricSchema.index({ patient_id: 1, metric_type: 1, measurement_date: -1 });
progressMetricSchema.index({ doctor_id: 1, measurement_date: -1 });
progressMetricSchema.index({ session_id: 1 });

// Pre-save middleware to calculate severity level based on metric value
progressMetricSchema.pre('save', function(next) {
  if (this.metric_value !== undefined && this.metric_value !== null) {
    if (this.metric_value >= 0 && this.metric_value <= 1) {
      this.severity_level = 'minimal';
    } else if (this.metric_value <= 3) {
      this.severity_level = 'mild';
    } else if (this.metric_value <= 5) {
      this.severity_level = 'moderate';
    } else if (this.metric_value <= 7) {
      this.severity_level = 'severe';
    } else {
      this.severity_level = 'extreme';
    }
  }
  
  this.updated_at = Date.now();
  next();
});

// Pre-validate middleware to calculate severity level for validation
progressMetricSchema.pre('validate', function(next) {
  if (this.metric_value !== undefined && this.metric_value !== null) {
    if (this.metric_value >= 0 && this.metric_value <= 1) {
      this.severity_level = 'minimal';
    } else if (this.metric_value <= 3) {
      this.severity_level = 'mild';
    } else if (this.metric_value <= 5) {
      this.severity_level = 'moderate';
    } else if (this.metric_value <= 7) {
      this.severity_level = 'severe';
    } else {
      this.severity_level = 'extreme';
    }
  }
  next();
});

// Virtual for progress trend calculation
progressMetricSchema.virtual('trend').get(function() {
  // This will be calculated in the controller for time-series data
  return null;
});

// Static method to get metrics for chart data
progressMetricSchema.statics.getTimeSeriesData = function(patientId, metricType, startDate, endDate) {
  const filter = {
    patient_id: patientId,
    metric_type: metricType,
    measurement_date: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.find(filter)
    .sort({ measurement_date: 1 })
    .select('metric_value measurement_date notes severity_level')
    .lean();
};

// Instance method to format for API response
progressMetricSchema.methods.toChartFormat = function() {
  return {
    x: this.measurement_date,
    y: this.metric_value,
    label: this.metric_type,
    severity: this.severity_level,
    notes: this.notes
  };
};

module.exports = mongoose.model('ProgressMetric', progressMetricSchema);
