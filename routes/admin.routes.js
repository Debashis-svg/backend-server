// server/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { 
  getDashboardStats, 
  getRecentTeams,
  getAllTeams,
  deleteTeam,
  verifyTeamPayment,
  getAllSubmissions,
  updateSubmissionScore,
  getLeaderboard,
  generateCertificates,
  finalizeRound1,
  publishRound1,
  finalizeRound2,
  publishRound2,
  setTeamQualification,
  deployRound2,
  deployRound1,
  getSettings
} = require('../controllers/admin.controller');
const { protect, adminProtect } = require('../middleware/auth.middleware');

// Protect all admin routes
router.use(protect, adminProtect);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/teams', getRecentTeams);

// Manage Teams
router.get('/teams/all', getAllTeams);
router.delete('/teams/:id', deleteTeam);
router.put('/teams/:id/verify', verifyTeamPayment);
router.put('/teams/:id/status', setTeamQualification);

// Evaluate Submissions
router.get('/submissions', getAllSubmissions);
router.put('/submissions/:id', updateSubmissionScore);

// Results & Certificates
router.get('/leaderboard', getLeaderboard);
router.post('/generate-certificates', generateCertificates);
router.post('/deploy-round-1', deployRound1);
router.post('/qualify-round-1', finalizeRound1);
router.post('/publish-round-1', publishRound1);
router.post('/qualify-round-2', finalizeRound2);
router.post('/publish-round-2', publishRound2);
router.post('/deploy-round-2', deployRound2);
router.get('/settings', getSettings);

module.exports = router;