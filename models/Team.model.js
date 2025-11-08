// server/models/Team.model.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Verified'],
    default: 'Pending',
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    signature: String,
  },
  
  // --- NEW STATUS FIELDS ---
  qualifiedForRound2: {
    type: Boolean,
    default: false,
  },
  qualifiedForRound3: {
    type: Boolean,
    default: false,
  },
  round1ResultsPublished: {
    type: Boolean,
    default: false,
  },
  round2ResultsPublished: {
    type: Boolean,
    default: false,
  }
  // --- END NEW FIELDS ---

}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);