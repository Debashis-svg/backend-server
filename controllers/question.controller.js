// server/controllers/question.controller.js
const Question = require('../models/Question.model');

exports.addQuestion = async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error(error); // <-- THIS IS THE FIX
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ round: 1, createdAt: -1 });
    res.status(200).json(questions);
  } catch (error) {
    console.error(error); // <-- THIS IS THE FIX
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error(error); // <-- THIS IS THE FIX
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error); // <-- THIS IS THE FIX
    res.status(500).json({ message: 'Server error', error });
  }
};