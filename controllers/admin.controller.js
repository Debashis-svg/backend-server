// server/controllers/admin.controller.js
const Team = require('../models/Team.model');
const User = require('../models/User.model');
const Submission = require('../models/Submission.model');
const Certificate = require('../models/Certificate.model');
const Question = require('../models/Question.model');
const Settings = require('../models/Settings.model');
const crypto = require('crypto');

// @desc    Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments({ teamName: { $ne: 'AdminTeam' } });
    
    res.status(200).json({
      totalTeams: totalTeams,
      verifiedPayments: totalTeams,
      totalRevenue: totalTeams * 2000,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get RECENT teams for admin dashboard
exports.getRecentTeams = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const teams = await Team.find({ teamName: { $ne: 'AdminTeam' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('leader', 'name email');

    res.status(200).json({ teams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get ALL teams for Manage Teams page
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find({ teamName: { $ne: 'AdminTeam' } })
      .sort({ createdAt: -1 })
      .populate('leader', 'name email')
      .populate('members', 'name email');

    res.status(200).json({ teams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a team and its members
exports.deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    await User.deleteMany({ team: teamId });
    await Team.findByIdAndDelete(teamId);

    res.status(200).json({ message: 'Team and all members deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Manually verify a team's payment
exports.verifyTeamPayment = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'Verified' },
      { new: true }
    );

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({ team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Manually set a team's qualification status
exports.setTeamQualification = async (req, res) => {
  const { qualified } = req.body; 

  if (typeof qualified !== 'boolean') {
    return res.status(400).json({ message: 'Invalid status provided.' });
  }

  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { qualifiedForRound2: qualified },
      { new: true }
    ).populate('leader', 'name email').populate('members', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({ team });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all submissions for evaluation
exports.getAllSubmissions = async (req, res) => {
  try {
    const query = {};
    if (req.query.round) {
      query.round = req.query.round;
    }

    const submissions = await Submission.find(query)
      .populate('team', 'teamName')
      .populate({
         path: 'answers.questionId',
         select: 'title type'
      })
      .sort({ submittedAt: -1 });

    res.status(200).json({ submissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a submission's score (manual override)
exports.updateSubmissionScore = async (req, res) => {
  const { totalScore, status } = req.body;
  
  try {
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { 
        totalScore, 
        status: status || 'Evaluated'
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const round = req.query.round || 1;
    const submissions = await Submission.find({ round: round })
      .populate('team', 'teamName')
      .sort({ totalScore: -1 });

    res.status(200).json({ leaderboard: submissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Generate certificates for teams
exports.generateCertificates = async (req, res) => {
  try {
    await Certificate.deleteMany({});
    let processedTeams = new Set();
    
    const r2Submissions = await Submission.find({ round: 2 }).populate('team').sort({ totalScore: -1 });
    const r2Questions = await Question.find({ round: 2 });
    const r2TotalPoints = r2Questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const outstandingScoreMark = r2TotalPoints * 0.80;
    const outstandingRankCutoff = Math.ceil(r2Submissions.length * 0.10);

    const winners = r2Submissions.slice(0, 3);
    if (winners[0] && winners[0].team) {
      await createCertificate(winners[0].team._id, winners[0].team.teamName, 'Winner - 1st Place', processedTeams);
    }
    if (winners[1] && winners[1].team) {
      await createCertificate(winners[1].team._id, winners[1].team.teamName, 'Winner - 2nd Place', processedTeams);
    }
    if (winners[2] && winners[2].team) {
      await createCertificate(winners[2].team._id, winners[2].team.teamName, 'Winner - 3rd Place', processedTeams);
    }

    const outstandingCandidates = r2Submissions.slice(0, outstandingRankCutoff);
    for (const sub of outstandingCandidates) {
      if (sub.team && sub.totalScore >= outstandingScoreMark) {
        await createCertificate(sub.team._id, sub.team.teamName, 'Outstanding', processedTeams);
      }
    }
    
    const allTeams = await Team.find({ teamName: { $ne: 'AdminTeam' } });

    for (const team of allTeams) {
      if (team.qualifiedForRound2) {
        await createCertificate(team._id, team.teamName, 'Appreciation', processedTeams);
      }
      await createCertificate(team._id, team.teamName, 'Participation', processedTeams);
    }

    await Settings.updateOne({ singleton: 'global_settings' }, { $set: { certificatesPublished: true } });

    generatedCount = processedTeams.size;
    res.status(201).json({ 
      message: `Successfully generated ${generatedCount} new certificates and published them.` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Finalize Round 1
exports.finalizeRound1 = async (req, res) => {
  try {
    const round1Questions = await Question.find({ round: 1 });
    const totalPoints = round1Questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const fiftyPercentMark = totalPoints / 2;

    const submissions = await Submission.find({ round: 1 })
      .populate('team', '_id teamName')
      .sort({ totalScore: -1 });

    if (submissions.length === 0) {
      return res.status(404).json({ message: "No submissions found for Round 1" });
    }

    const totalSubmissions = submissions.length;
    const rankCutoff = Math.ceil(totalSubmissions * 0.75);

    let qualifiedTeams = [];
    let rank = 1;
    
    for (const sub of submissions) {
      if (!sub.team) continue;
      const score = sub.totalScore;
      const isScoreQualified = score >= fiftyPercentMark;
      const isRankQualified = rank <= rankCutoff;

      if (isScoreQualified || isRankQualified) {
        qualifiedTeams.push(sub.team._id);
      }
      rank++;
    }

    await Team.updateMany(
      { teamName: { $ne: 'AdminTeam' } },
      { $set: { qualifiedForRound2: false } }
    );
    await Team.updateMany(
      { _id: { $in: qualifiedTeams } },
      { $set: { qualifiedForRound2: true } }
    );

    res.status(200).json({
      message: `Successfully finalized Round 1. ${qualifiedTeams.length} teams have qualified for Round 2.`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Publish Round 1 Results
exports.publishRound1 = async (req, res) => {
  try {
    const submissions = await Submission.find({ round: 1 }).select('team');
    const teamIds = submissions.map(s => s.team).filter(t => t);

    await Team.updateMany(
      { _id: { $in: teamIds } },
      { $set: { round1ResultsPublished: true } }
    );
    
    res.status(200).json({ message: "Round 1 results are now published. All participants will be notified on their dashboard." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Finalize Round 2
exports.finalizeRound2 = async (req, res) => {
  try {
    const submissions = await Submission.find({ round: 2 })
      .populate('team', '_id teamName')
      .sort({ totalScore: -1 });

    if (submissions.length === 0) {
      return res.status(404).json({ message: "No submissions found for Round 2" });
    }
    
    const rankCutoff = Math.ceil(submissions.length * 0.5); 
    let qualifiedTeams = [];
    
    for(let i=0; i < rankCutoff; i++) {
      if (submissions[i].team) {
        qualifiedTeams.push(submissions[i].team._id);
      }
    }

    await Team.updateMany(
      { teamName: { $ne: 'AdminTeam' } },
      { $set: { qualifiedForRound3: false } }
    );
    await Team.updateMany(
      { _id: { $in: qualifiedTeams } },
      { $set: { qualifiedForRound3: true } }
    );

    res.status(200).json({
      message: `Successfully finalized Round 2. ${qualifiedTeams.length} teams have qualified for Round 3.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Publish Round 2 Results
exports.publishRound2 = async (req, res) => {
  try {
    const submissions = await Submission.find({ round: 2 }).select('team');
    const teamIds = submissions.map(s => s.team).filter(t => t);

    await Team.updateMany(
      { _id: { $in: teamIds } },
      { $set: { round2ResultsPublished: true } }
    );
    
    res.status(200).json({ message: "Round 2 results are now published. Participants will be notified." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Deploy Round 2
exports.deployRound2 = async (req, res) => {
  try {
    await Settings.updateOne(
      { singleton: 'global_settings' },
      { $set: { round2Live: true } }
    );
    res.status(200).json({ message: 'Round 2 is now live for all qualified participants.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Helper for cert generation
const createCertificate = async (teamId, teamName, achievement, processedSet) => {
  if (processedSet.has(teamId.toString())) {
    return;
  }
  const verificationId = crypto.randomBytes(16).toString('hex');
  const newCert = new Certificate({
    team: teamId,
    teamName: teamName,
    achievement: achievement,
    verificationId: verificationId,
  });
  await newCert.save();
  processedSet.add(teamId.toString());
};

exports.deployRound1 = async (req, res) => {
  try {
    await Settings.updateOne(
      { singleton: 'global_settings' },
      { $set: { round1Live: true } }
    );
    res.status(200).json({ message: 'Round 1 is now live for all participants.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- ADD THIS ENTIRE NEW FUNCTION ---
// @desc    Get all admin settings
// @route   GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({ singleton: 'global_settings' });
    if (!settings) {
      // This should not happen if seeder ran, but good to check
      const newSettings = await new Settings().save();
      return res.status(200).json(newSettings);
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
// --- END NEW FUNCTION ---