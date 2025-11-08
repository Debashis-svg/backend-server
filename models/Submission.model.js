// server/models/Submission.model.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  },
  answer: { // For MCQ: 'a', 'b'. For Code: 'the user's code string'
    type: String,
  },
  isCorrect: {
    type: Boolean,
  },
  score: {
    type: Number,
    default: 0,
  }
});

const submissionSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  round: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
  },
  answers: [answerSchema],
  totalScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Submitted', 'Evaluated', 'Pending'],
    default: 'Submitted',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Submission', submissionSchema);