// server/routes/certificate.routes.js
const express = require('express');
const router = express.Router();
const { downloadCertificate } = require('../controllers/certificate.controller');
const { protect } = require('../middleware/auth.middleware');

// This is a protected route. Only a logged-in user can download their own cert.
router.get('/download', protect, downloadCertificate);

module.exports = router;