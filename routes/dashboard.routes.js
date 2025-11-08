// server/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getDashboardData);

module.exports = router;