// server/routes/verify.routes.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate.model');

// @route   GET /api/verify/:id
// @desc    Public route to verify a certificate
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      verificationId: req.params.id 
    });

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found or invalid.' });
    }

    res.status(200).json({ certificate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;