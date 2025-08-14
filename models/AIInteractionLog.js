const mongoose = require('mongoose');

const aiInteractionLogSchema = new mongoose.Schema({
  // Context Information
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
  session_id: {
    type: String,
    required: false
  },

  // Request Data
  request_data: {
    // Patient metrics submitted for analysis
    metrics: [{
      metric_type: {
        type: String,
        enum: [
          'anxiety', 'depression', 'mood', 'energy', 'sleep_quality', 
          'stress', 'focus', 'motivation', 'social_interaction', 
          'self_esteem', 'therapy_engagement', 'medication_adherence',
          'physical_activity', 'emotional_regulation', 'cognitive_function'
        ]
      },
      metric_value: {
        type: Number,
        min: 0,
        max: 10
      },
      measurement_date: Date,
      severity_level: {
        type: String,
        enum: ['minimal', 'mild', 'moderate', 'severe', 'extreme']
      }
    }],

    // Patient history context
    patient_history: {
      type: String,
      maxlength: 5000
    },

    // Additional context parameters
    context_parameters: {
      therapy_duration: Number, // in days
      previous_sessions: Number,
      current_medications: [String],
      therapy_goals: [String],
      risk_factors: [String]
    },

    // Request metadata
    request_timestamp: {
      type: Date,
      default: Date.now
    },
    request_id: {
      type: String,
      required: true,
      unique: true
    }
  },

  // Response Data  
  response_data: {
    // AI Suggestion (placeholder structure for Phase 4)
    suggestions: [{
      category: {
        type: String,
        enum: [
          'therapy_technique', 'medication_adjustment', 'lifestyle_change',
          'resource_recommendation', 'session_frequency', 'goal_modification',
          'risk_assessment', 'progress_tracking'
        ]
      },
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      confidence_score: {
        type: Number,
        min: 0,
        max: 1
      },
      rationale: String,
      recommended_actions: [String],
      expected_outcomes: [String]
    }],

    // Analysis summary
    analysis_summary: {
      overall_risk_level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical'],
        default: 'moderate'
      },
      trend_analysis: {
        improving_metrics: [String],
        declining_metrics: [String],
        stable_metrics: [String]
      },
      key_insights: [String],
      recommended_focus_areas: [String]
    },

    // Response metadata
    response_timestamp: {
      type: Date,
      default: Date.now
    },
    processing_time_ms: Number,
    ai_model_version: {
      type: String,
      default: 'placeholder-v1.0'
    }
  },

  // Interaction Metadata
  interaction_metadata: {
    user_agent: String,
    ip_address: String,
    source: {
      type: String,
      enum: ['web_dashboard', 'mobile_app', 'api_direct'],
      default: 'web_dashboard'
    },
    interaction_type: {
      type: String,
      enum: ['manual_request', 'automated_analysis', 'scheduled_review'],
      default: 'manual_request'
    }
  },

  // Status and Quality Tracking
  status: {
    type: String,
    enum: ['success', 'partial_success', 'error', 'timeout'],
    default: 'success'
  },
  error_details: {
    error_code: String,
    error_message: String,
    stack_trace: String
  },

  // Future AI Integration Flags
  ai_flags: {
    ready_for_ai_analysis: {
      type: Boolean,
      default: false
    },
    data_quality_score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    requires_human_review: {
      type: Boolean,
      default: true
    }
  }

}, {
  timestamps: true,
  collection: 'ai_interaction_logs'
});

// Indexes for efficient querying
aiInteractionLogSchema.index({ patient_id: 1, createdAt: -1 });
aiInteractionLogSchema.index({ doctor_id: 1, createdAt: -1 });
aiInteractionLogSchema.index({ 'request_data.request_id': 1 }, { unique: true });
aiInteractionLogSchema.index({ session_id: 1 });
aiInteractionLogSchema.index({ createdAt: -1 });
aiInteractionLogSchema.index({ status: 1 });

// Pre-save middleware to generate request_id if not provided
aiInteractionLogSchema.pre('save', function(next) {
  if (!this.request_data.request_id) {
    this.request_data.request_id = `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Static method to get interaction statistics
aiInteractionLogSchema.statics.getInteractionStats = function(doctorId, startDate, endDate) {
  const filter = {
    doctor_id: doctorId
  };
  
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avg_processing_time: { $avg: '$response_data.processing_time_ms' }
      }
    }
  ]);
};

// Instance method to sanitize for client response
aiInteractionLogSchema.methods.toClientResponse = function() {
  return {
    request_id: this.request_data.request_id,
    suggestions: this.response_data.suggestions,
    analysis_summary: this.response_data.analysis_summary,
    timestamp: this.createdAt,
    status: this.status
  };
};

module.exports = mongoose.model('AIInteractionLog', aiInteractionLogSchema);
