// server/routes/test.routes.js
console.log("--- Loading test.routes.js ---");
const express = require('express');
const router = express.Router();
const { getTestQuestions, submitTest, runCode } = require('../controllers/test.controller');
const { protect } = require('../middleware/auth.middleware');

console.log("test.routes: Importing functions...", { getTestQuestions, submitTest, runCode });

if (typeof runCode !== 'function') {
  console.error("FATAL: runCode function is undefined!");
}

// Protect all test routes
router.use(protect);

router.get('/:round', getTestQuestions);
router.post('/run', runCode);
router.post('/:round/submit', submitTest);

module.exports = router;
console.log("--- test.routes.js loaded successfully ---");