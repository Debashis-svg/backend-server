// server/routes/question.routes.js
const express = require('express');
const router = express.Router();
const { 
  addQuestion, 
  getAllQuestions, 
  updateQuestion, 
  deleteQuestion 
} = require('../controllers/question.controller');
const { protect, adminProtect } = require('../middleware/auth.middleware');

// Apply auth middleware to all routes
router.use(protect, adminProtect);

router.route('/')
  .post(addQuestion)
  .get(getAllQuestions);

router.route('/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;