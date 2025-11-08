// server/models/Certificate.model.js
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  teamName: { // Denormalized for easy lookup
    type: String,
    required: true,
  },
  achievement: {
    type: String,
    enum: ['Winner - 1st Place', 'Winner - 2nd Place', 'Winner - 3rd Place', 'Outstanding', 'Appreciation', 'Participation'],
    required: true,
  },
  // This unique ID will be in the QR code
  verificationId: {
    type: String,
    required: true,
    unique: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Certificate', certificateSchema);