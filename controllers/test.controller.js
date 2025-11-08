// server/controllers/test.controller.js
const Question = require('../models/Question.model');
const Submission = require('../models/Submission.model');
const judge0Service = require('../services/judge0Service');

exports.getTestQuestions = async (req, res) => {
  const { round } = req.params; // e.g., 'round1' or 'round2'
  
  try {
    let roundNumber = 1;
    if (round === 'round2') roundNumber = 2;

    const existingSubmission = await Submission.findOne({ team: req.teamId, round: roundNumber });
    if (existingSubmission) {
      return res.status(403).json({ message: 'You have already submitted for this round.' });
    }

    const questions = await Question.find({ round: roundNumber })
      .select('-correctAnswer -testCases.expectedOutput');

    const questionsWithVisibleTestCases = questions.map(question => {
      const qObj = question.toObject();
      if (qObj.testCases) {
        // Use the simplified logic: send only the first 2 test cases
        qObj.testCases = qObj.testCases.slice(0, 2);
      }
      return qObj;
    });

    res.status(200).json({ questions: questionsWithVisibleTestCases });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.runCode = async (req, res) => {
  const { code, language, questionId } = req.body;

  try {
    const question = await Question.findById(questionId).select('testCases');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Use the simplified logic: run against only the first 2 test cases
    const visibleTestCases = question.testCases.slice(0, 2);

    if (visibleTestCases.length === 0) {
      return res.status(200).json({
        status: "No Visible Test Cases",
        message: "No visible test cases to run against.",
        outputs: ["N/A"]
      });
    }

    const results = await judge0Service.evaluate(code, language, visibleTestCases);
    
    res.status(200).json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.submitTest = async (req, res) => {
  const { round } = req.params;
  const { answers } = req.body;
  
  try {
    let roundNumber = 1;
    if (round === 'round2') roundNumber = 2;

    let totalScore = 0;
    const processedAnswers = [];
    let containsCode = false;

    for (const ans of answers) {
      const question = await Question.findById(ans.questionId);
      if (!question) continue;

      let score = 0;
      let isCorrect = false;

      if (question.type === 'mcq' || question.type === 'aptitude') {
        if (question.correctAnswer === ans.answer) {
          score = question.points;
          isCorrect = true;
          totalScore += score;
        }
      } else if (question.type === 'code' || question.type === 'ai_ml') {
        containsCode = true;
        // This is correct: submitTest uses ALL test cases
        const judgeResult = await judge0Service.evaluate(ans.answer, ans.language || 'cpp', question.testCases);
        score = (judgeResult.score / 100) * question.points;
        isCorrect = judgeResult.isCorrect;
        totalScore += score;
      }

      processedAnswers.push({
        questionId: ans.questionId,
        answer: ans.answer,
        isCorrect,
        score
      });
    }

    const newSubmission = new Submission({
      team: req.teamId,
      round: roundNumber,
      answers: processedAnswers,
      totalScore: totalScore,
      status: containsCode ? 'Pending' : 'Evaluated' 
    });

    await newSubmission.save();

    res.status(201).json({ 
      message: 'Submission successful', 
      submissionId: newSubmission._id,
      totalScore
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};