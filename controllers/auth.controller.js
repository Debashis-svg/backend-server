// server/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const Team = require('../models/Team.model');

// Helper function to create token
const generateToken = (user, teamId) => {
  const payload = {
    userId: user._id,
    teamId: teamId,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return { token, userResponse };
};

exports.register = async (req, res) => {
  const { teamName, password, members, paymentDetails } = req.body;

  if (!teamName || !password || !members || !paymentDetails) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${paymentDetails.razorpay_order_id}|${paymentDetails.razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== paymentDetails.razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({ message: 'Team name is already taken' });
    }
    const memberEmails = members.map(m => m.email);
    const existingUser = await User.findOne({ email: { $in: memberEmails } });
    if (existingUser) {
      return res.status(400).json({ message: `Email ${existingUser.email} is already on a team` });
    }

    const createdUsers = await Promise.all(
      members.map(member => 
        new User({
          name: member.name,
          email: member.email,
          role: member.role,
        }).save()
      )
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const leader = createdUsers[0];

    const newTeam = new Team({
      teamName,
      password: hashedPassword,
      leader: leader._id,
      members: createdUsers.map(u => u._id),
      paymentStatus: 'Verified',
      paymentDetails: {
        orderId: paymentDetails.razorpay_order_id,
        paymentId: paymentDetails.razorpay_payment_id,
        signature: paymentDetails.razorpay_signature,
      }
    });
    await newTeam.save();

    await User.updateMany(
      { _id: { $in: createdUsers.map(u => u._id) } },
      { $set: { team: newTeam._id } }
    );

    const { token, userResponse } = generateToken(leader, newTeam._id);

    res.status(201).json({
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error("CRASH in auth.controller register:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const team = await Team.findById(user.team);
    if (!team) {
      return res.status(404).json({ message: 'Team not found for this user' });
    }

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { token, userResponse } = generateToken(user, team._id);

    res.status(200).json({
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error("CRASH in auth.controller login:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    }
  });
};