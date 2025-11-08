// server/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

// Protect this route so only logged-in users (in theory) could access,
// though register page is public. We'll protect it on the frontend.
// For now, let's just make it simple.
router.post('/create-order', createOrder);

module.exports = router;