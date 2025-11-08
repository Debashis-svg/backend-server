// server/models/Settings.model.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  singleton: {
    type: String,
    default: 'global_settings',
    unique: true
  },
  round1Live: { // Deployed
    type: Boolean,
    default: false,
  },
  round1Finalized: {
    type: Boolean,
    default: false,
  },
  round1Published: {
    type: Boolean,
    default: false,
  },
  round2Live: { // Deployed
    type: Boolean,
    default: false,
  },
  round2Finalized: {
    type: Boolean,
    default: false,
  },
  round2Published: { // This is for final results
    type: Boolean,
    default: false,
  },
  certificatesPublished: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('Settings', settingsSchema);