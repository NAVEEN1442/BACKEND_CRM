const express = require('express');
const router = express.Router();

const {
  generateAISuggestions,
  getAIInteractionHistory,
  getAIAnalytics
} = require('../controllers/aiSuggestionsController');

const { verifyToken, isDoctor } = require('../middleware/authMiddleware');

// Middleware: All AI suggestion endpoints require authentication and doctor role
router.use(verifyToken);
router.use(isDoctor);

/**
 * POST /suggestions/ai
 * Generate AI suggestions for a patient
 * 
 * Body:
 * - patient_id (required): Patient ID to analyze
 * - session_id (optional): Current session ID
 * - context_parameters (optional): Additional context like medications, goals, etc.
 * - analysis_type (optional): Type of analysis ('comprehensive', 'quick', 'focused')
 */
router.post('/ai', generateAISuggestions);

/**
 * GET /suggestions/logs/:patient_id
 * Get AI interaction history for a specific patient
 * 
 * Query params:
 * - limit: Number of logs to return (default: 10)
 * - offset: Number of logs to skip (default: 0)
 */
router.get('/logs/:patient_id', getAIInteractionHistory);

/**
 * GET /suggestions/analytics
 * Get AI usage analytics for the authenticated doctor
 * 
 * Query params:
 * - days: Number of days to analyze (default: 30)
 */
router.get('/analytics', getAIAnalytics);

module.exports = router;
