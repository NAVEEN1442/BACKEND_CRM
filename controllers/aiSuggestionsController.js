const AIInteractionLog = require('../models/AIInteractionLog');
const Patient = require('../models/Patient');
const PatientHistory = require('../models/PatientHistory');
const ProgressMetric = require('../models/ProgressMetric');
const Doctor = require('../models/Doctor');

/**
 * POST /suggestions/ai
 * AI Preparation Layer - Placeholder AI suggestions endpoint
 * 
 * This endpoint simulates how AI suggestions will work in Phase 4.
 * It accepts patient context, returns placeholder suggestions, 
 * and logs all interactions for future AI analysis.
 */
const generateAISuggestions = async (req, res) => {
  const startTime = Date.now();
  let interactionLog = null;

  try {
    const {
      patient_id,
      session_id,
      context_parameters,
      analysis_type = 'comprehensive'
    } = req.body;

    const doctor_id = req.user.id; // From JWT middleware

    // Validation
    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Verify patient exists and doctor has access
    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor is assigned to this patient
    if (patient.therapist_id?.toString() !== doctor_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to this patient.'
      });
    }

    // Gather patient context data
    const patientContext = await gatherPatientContext(patient_id);
    
    // Generate placeholder suggestions
    const aiResponse = await generatePlaceholderSuggestions(patientContext, analysis_type);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Create interaction log
    interactionLog = new AIInteractionLog({
      patient_id: patient_id,
      doctor_id: doctor_id,
      session_id: session_id,
      request_data: {
        metrics: patientContext.recentMetrics,
        patient_history: patientContext.patientHistory,
        context_parameters: {
          therapy_duration: patientContext.therapyDuration,
          previous_sessions: patientContext.previousSessions,
          current_medications: context_parameters?.current_medications || [],
          therapy_goals: context_parameters?.therapy_goals || [],
          risk_factors: context_parameters?.risk_factors || []
        }
      },
      response_data: {
        suggestions: aiResponse.suggestions,
        analysis_summary: aiResponse.analysis_summary,
        processing_time_ms: processingTime,
        ai_model_version: 'placeholder-v1.0'
      },
      interaction_metadata: {
        user_agent: req.get('User-Agent'),
        ip_address: req.ip,
        source: 'web_dashboard',
        interaction_type: 'manual_request'
      },
      status: 'success',
      ai_flags: {
        ready_for_ai_analysis: true,
        data_quality_score: calculateDataQualityScore(patientContext),
        requires_human_review: shouldRequireHumanReview(aiResponse)
      }
    });

    await interactionLog.save();

    // Return response to client
    res.status(200).json({
      success: true,
      request_id: interactionLog.request_data.request_id,
      data: {
        suggestions: aiResponse.suggestions,
        analysis_summary: aiResponse.analysis_summary,
        patient_context_summary: {
          total_metrics: patientContext.recentMetrics.length,
          therapy_duration_days: patientContext.therapyDuration,
          last_session_date: patientContext.lastSessionDate,
          risk_level: aiResponse.analysis_summary.overall_risk_level
        }
      },
      metadata: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
        requires_human_review: interactionLog.ai_flags.requires_human_review,
        data_quality_score: interactionLog.ai_flags.data_quality_score
      }
    });

  } catch (error) {
    console.error('AI Suggestion Generation Error:', error);

    // Log error if we have an interaction log started
    if (interactionLog) {
      interactionLog.status = 'error';
      interactionLog.error_details = {
        error_code: 'PROCESSING_ERROR',
        error_message: error.message,
        stack_trace: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
      await interactionLog.save().catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: 'Error generating AI suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Gather comprehensive patient context for AI analysis
 */
async function gatherPatientContext(patient_id) {
  try {
    // Get recent metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMetrics = await ProgressMetric.find({
      patient_id: patient_id,
      measurement_date: { $gte: thirtyDaysAgo }
    }).sort({ measurement_date: -1 }).limit(50);

    // Get patient history
    const history = await PatientHistory.findOne({ patient_id: patient_id });
    
    // Calculate therapy duration
    const patient = await Patient.findById(patient_id).populate('user_id');
    const therapyStartDate = patient.createdAt || new Date();
    const therapyDuration = Math.floor((Date.now() - therapyStartDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      recentMetrics: recentMetrics.map(metric => ({
        metric_type: metric.metric_type,
        metric_value: metric.metric_value,
        measurement_date: metric.measurement_date,
        severity_level: metric.severity_level
      })),
      patientHistory: history?.history_text || '',
      therapyDuration: therapyDuration,
      previousSessions: recentMetrics.filter(m => m.session_id).length,
      lastSessionDate: recentMetrics.find(m => m.session_id)?.measurement_date || null
    };
  } catch (error) {
    console.error('Error gathering patient context:', error);
    return {
      recentMetrics: [],
      patientHistory: '',
      therapyDuration: 0,
      previousSessions: 0,
      lastSessionDate: null
    };
  }
}

/**
 * Generate placeholder AI suggestions (Phase 4 ready structure)
 */
async function generatePlaceholderSuggestions(patientContext, analysisType) {
  const { recentMetrics } = patientContext;
  
  // Analyze metric trends for placeholder logic
  const metricAnalysis = analyzeMetricTrends(recentMetrics);
  
  // Generate suggestions based on placeholder rules
  const suggestions = [];
  
  // High anxiety suggestion
  if (metricAnalysis.highAnxietyMetrics.length > 0) {
    suggestions.push({
      category: 'therapy_technique',
      title: 'Focus on Anxiety Management Techniques',
      description: 'Patient shows elevated anxiety levels. Consider implementing breathing exercises and cognitive restructuring techniques.',
      priority: 'high',
      confidence_score: 0.85,
      rationale: `Recent metrics show anxiety levels averaging ${metricAnalysis.avgAnxiety.toFixed(1)}/10`,
      recommended_actions: [
        'Introduce progressive muscle relaxation',
        'Practice mindfulness meditation',
        'Implement thought challenging exercises'
      ],
      expected_outcomes: [
        'Reduced anxiety symptoms within 2-3 sessions',
        'Improved coping strategies',
        'Better stress management'
      ]
    });
  }

  // Depression-related suggestion
  if (metricAnalysis.lowMoodMetrics.length > 0) {
    suggestions.push({
      category: 'lifestyle_change',
      title: 'Behavioral Activation Strategies',
      description: 'Low mood patterns detected. Recommend increasing pleasant activities and social engagement.',
      priority: 'medium',
      confidence_score: 0.78,
      rationale: `Mood and energy metrics trending below average`,
      recommended_actions: [
        'Schedule 2-3 pleasant activities weekly',
        'Increase physical activity gradually',
        'Encourage social connections'
      ],
      expected_outcomes: [
        'Improved mood stability',
        'Increased energy levels',
        'Enhanced social functioning'
      ]
    });
  }

  // Session frequency suggestion
  if (patientContext.therapyDuration > 30 && metricAnalysis.overallTrend === 'improving') {
    suggestions.push({
      category: 'session_frequency',
      title: 'Consider Session Frequency Adjustment',
      description: 'Patient showing good progress. May be ready for reduced session frequency.',
      priority: 'low',
      confidence_score: 0.72,
      rationale: 'Consistent improvement over past month indicates good therapeutic progress',
      recommended_actions: [
        'Discuss reducing to bi-weekly sessions',
        'Implement self-monitoring tools',
        'Plan maintenance strategies'
      ],
      expected_outcomes: [
        'Maintained progress with increased independence',
        'Cost-effective treatment continuation',
        'Enhanced self-efficacy'
      ]
    });
  }

  // Default suggestion if no specific patterns detected
  if (suggestions.length === 0) {
    suggestions.push({
      category: 'progress_tracking',
      title: 'Continue Current Treatment Plan',
      description: 'Patient metrics are stable. Continue with current therapeutic approach while monitoring progress.',
      priority: 'medium',
      confidence_score: 0.65,
      rationale: 'No significant concerning patterns detected in recent metrics',
      recommended_actions: [
        'Continue current therapy techniques',
        'Monitor weekly progress metrics',
        'Adjust interventions as needed'
      ],
      expected_outcomes: [
        'Maintained therapeutic progress',
        'Stable mental health metrics',
        'Continued patient engagement'
      ]
    });
  }

  // Generate analysis summary
  const analysis_summary = {
    overall_risk_level: determineRiskLevel(metricAnalysis),
    trend_analysis: {
      improving_metrics: metricAnalysis.improvingMetrics,
      declining_metrics: metricAnalysis.decliningMetrics,
      stable_metrics: metricAnalysis.stableMetrics
    },
    key_insights: generateKeyInsights(metricAnalysis, patientContext),
    recommended_focus_areas: suggestions.slice(0, 3).map(s => s.category)
  };

  return {
    suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
    analysis_summary
  };
}

/**
 * Analyze metric trends from recent data
 */
function analyzeMetricTrends(metrics) {
  const metricsByType = {};
  const analysis = {
    highAnxietyMetrics: [],
    lowMoodMetrics: [],
    improvingMetrics: [],
    decliningMetrics: [],
    stableMetrics: [],
    avgAnxiety: 0,
    overallTrend: 'stable'
  };

  // Group metrics by type
  metrics.forEach(metric => {
    if (!metricsByType[metric.metric_type]) {
      metricsByType[metric.metric_type] = [];
    }
    metricsByType[metric.metric_type].push(metric.metric_value);
  });

  // Analyze each metric type
  Object.entries(metricsByType).forEach(([metricType, values]) => {
    if (values.length < 2) return;

    const recent = values.slice(0, Math.floor(values.length / 2));
    const older = values.slice(Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = recentAvg - olderAvg;

    if (metricType === 'anxiety') {
      analysis.avgAnxiety = recentAvg;
      if (recentAvg > 6) analysis.highAnxietyMetrics.push(metricType);
    }

    if (['mood', 'energy', 'motivation'].includes(metricType) && recentAvg < 4) {
      analysis.lowMoodMetrics.push(metricType);
    }

    if (Math.abs(change) < 0.5) {
      analysis.stableMetrics.push(metricType);
    } else if (change > 0) {
      analysis.improvingMetrics.push(metricType);
    } else {
      analysis.decliningMetrics.push(metricType);
    }
  });

  // Determine overall trend
  if (analysis.improvingMetrics.length > analysis.decliningMetrics.length) {
    analysis.overallTrend = 'improving';
  } else if (analysis.decliningMetrics.length > analysis.improvingMetrics.length) {
    analysis.overallTrend = 'declining';
  }

  return analysis;
}

/**
 * Determine overall risk level
 */
function determineRiskLevel(metricAnalysis) {
  const criticalMetrics = metricAnalysis.highAnxietyMetrics.length + metricAnalysis.lowMoodMetrics.length;
  const decliningCount = metricAnalysis.decliningMetrics.length;
  
  if (criticalMetrics >= 3 || decliningCount >= 4) return 'high';
  if (criticalMetrics >= 2 || decliningCount >= 2) return 'moderate';
  return 'low';
}

/**
 * Generate key insights
 */
function generateKeyInsights(metricAnalysis, patientContext) {
  const insights = [];
  
  if (metricAnalysis.overallTrend === 'improving') {
    insights.push('Patient shows overall improvement in therapeutic metrics');
  }
  
  if (metricAnalysis.decliningMetrics.length > 0) {
    insights.push(`Attention needed for declining metrics: ${metricAnalysis.decliningMetrics.join(', ')}`);
  }
  
  if (patientContext.therapyDuration > 90) {
    insights.push('Long-term therapy engagement indicates strong therapeutic alliance');
  }
  
  if (insights.length === 0) {
    insights.push('Patient metrics show stable therapeutic progress');
  }
  
  return insights;
}

/**
 * Calculate data quality score for AI readiness
 */
function calculateDataQualityScore(patientContext) {
  let score = 0;
  
  // Metrics availability (40% of score)
  if (patientContext.recentMetrics.length > 0) score += 0.4;
  
  // History completeness (30% of score)
  if (patientContext.patientHistory && patientContext.patientHistory.length > 50) score += 0.3;
  
  // Therapy duration (20% of score)
  if (patientContext.therapyDuration > 7) score += 0.2;
  
  // Recent activity (10% of score)
  if (patientContext.lastSessionDate && 
      (Date.now() - new Date(patientContext.lastSessionDate).getTime()) < 14 * 24 * 60 * 60 * 1000) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Determine if human review is required
 */
function shouldRequireHumanReview(aiResponse) {
  // High-risk cases always require review
  if (aiResponse.analysis_summary.overall_risk_level === 'high') return true;
  
  // High-priority urgent suggestions require review
  const urgentSuggestions = aiResponse.suggestions.filter(s => s.priority === 'urgent');
  if (urgentSuggestions.length > 0) return true;
  
  // Low confidence suggestions require review
  const lowConfidenceSuggestions = aiResponse.suggestions.filter(s => s.confidence_score < 0.7);
  if (lowConfidenceSuggestions.length > 2) return true;
  
  return false;
}

/**
 * GET /suggestions/logs/:patient_id
 * Get AI interaction history for a patient
 */
const getAIInteractionHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const doctor_id = req.user.id;

    // Verify patient access
    const patient = await Patient.findById(patient_id);
    if (!patient || patient.therapist_id?.toString() !== doctor_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const logs = await AIInteractionLog
      .find({ patient_id, doctor_id })
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('request_data.request_id response_data.suggestions response_data.analysis_summary createdAt status ai_flags.requires_human_review');

    const total = await AIInteractionLog.countDocuments({ patient_id, doctor_id });

    res.status(200).json({
      success: true,
      data: {
        logs: logs.map(log => log.toClientResponse()),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching AI interaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interaction history'
    });
  }
};

/**
 * GET /suggestions/analytics
 * Get AI usage analytics for the doctor
 */
const getAIAnalytics = async (req, res) => {
  try {
    const doctor_id = req.user.id;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const stats = await AIInteractionLog.getInteractionStats(doctor_id, startDate, new Date());
    
    const totalInteractions = await AIInteractionLog.countDocuments({
      doctor_id,
      createdAt: { $gte: startDate }
    });

    res.status(200).json({
      success: true,
      data: {
        total_interactions: totalInteractions,
        period_days: parseInt(days),
        status_breakdown: stats,
        period_start: startDate.toISOString(),
        period_end: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

module.exports = {
  generateAISuggestions,
  getAIInteractionHistory,
  getAIAnalytics
};
