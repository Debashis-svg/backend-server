// server/models/Question.model.js
const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
});

const mcqOptionSchema = new mongoose.Schema({
  id: { type: String, required: true }, // 'a', 'b', 'c', 'd'
  text: { type: String, required: true }
});

// --- NEW SCHEMA FOR DEFAULT CODE SNIPPETS ---
const defaultCodeSnippetSchema = new mongoose.Schema({
  language: { type: String, required: true, enum: ['cpp', 'python', 'java', 'javascript'] },
  code: { type: String, required: true },
});
// --- END NEW SCHEMA ---

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  round: {
    type: Number,
    required: true,
    enum: [1, 2],
  },
  type: {
    type: String,
    required: true,
    enum: ['mcq', 'aptitude', 'code', 'ai_ml'],
  },
  points: {
    type: Number,
    default: 10,
  },
  // For 'mcq' and 'aptitude'
  options: [mcqOptionSchema],
  correctAnswer: { // e.g., 'a'
    type: String,
  },
  // For 'code' and 'ai_ml'
  testCases: [testCaseSchema],
  // --- UPDATED FIELD ---
  defaultCodeSnippets: [defaultCodeSnippetSchema],
  // --- END UPDATED FIELD ---
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);