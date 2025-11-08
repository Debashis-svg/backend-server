// server/controllers/dashboard.controller.js
const Team = require('../models/Team.model');
const Submission = require('../models/Submission.model'); // <-- Corrected path
const Settings = require('../models/Settings.model');

// --- HELPER FUNCTION: This will hold all our competition logic ---
const getCompetitionStatus = (team, pastSubmissions, settings) => {
  
  const hasSubmittedRound1 = pastSubmissions.some(sub => sub.round === 1);
  const hasSubmittedRound2 = pastSubmissions.some(sub => sub.round === 2);

  // --- Logic for Round 3 / Post-Round 2 ---
  if (hasSubmittedRound2) {
    if (team.round2ResultsPublished) {
      if (team.qualifiedForRound3) {
        return {
          name: 'Round 3: Offline Hackathon',
          description: "Congratulations! You have qualified for the final offline hackathon at NIT Silchar. We will contact you with details.",
          status: 'Qualified_Final',
          link: null
        };
      } else {
        return {
          name: 'Round 2: Completed',
          description: "Thank you for participating in Round 2. Unfortunately, you did not qualify for the final round. We hope to see you next year.",
          status: 'Not_Qualified',
          link: null
        };
      }
    } else {
      return {
        name: 'Round 2: Completed',
        description: "Your submission for Round 2 has been received. Results are being finalized. Please check back soon.",
        status: 'Completed_Pending_R2',
        link: null
      };
    }
  }

  // --- Logic for Round 2 / Post-Round 1 ---
  if (hasSubmittedRound1) {
    if (team.round1ResultsPublished) {
      if (team.qualifiedForRound2) {
        if (settings.round2Live) {
          return {
            name: 'Round 2: AI/ML Challenges',
            description: "Congratulations! You have qualified for Round 2. This round is now live.",
            status: 'Qualified_Live',
            link: '/round-2'
          };
        } else {
          return {
            name: 'Round 1: Completed',
            description: "Congratulations! You have qualified for Round 2. Round 2 will be conducted soon. Please wait for the announcement.",
            status: 'Qualified_Waiting',
            link: null
          };
        }
      } else {
        return {
          name: 'Round 1: Completed',
          description: "Thank you for participating in Round 1. Unfortunately, you did not qualify for the next round. We hope to see you next year.",
          status: 'Not_Qualified',
          link: null
        };
      }
    } else {
      return {
        name: 'Round 1: Completed',
        description: "Your submission for Round 1 has been received. Results are being processed. Please check back later.",
        status: 'Completed_Pending_R1',
        link: null
      };
    }
  }

  // --- Logic for Round 1 (Not Submitted) ---
  if (settings.round1Live) {
    // Round 1 is deployed!
    return {
      name: 'Round 1: MCQ & Aptitude',
      description: 'The first online round is now live. You have 60 minutes to complete it.',
      status: 'Live',
      link: '/round-1'
    };
  } else {
    // Admin has not deployed Round 1 yet
    return {
      name: 'Round 1: Online Test',
      description: 'Round 1 has not started yet. Please wait for the official announcement.',
      status: 'Locked',
      link: null
    };
  }
};

// --- Main Controller ---
exports.getDashboardData = async (req, res) => {
  try {
    const team = await Team.findById(req.teamId).populate('members', 'name email role');
    const pastSubmissions = await Submission.find({ team: req.teamId })
      .sort({ submittedAt: -1 })
      .select('round totalScore status submittedAt');
    const settings = await Settings.findOne({ singleton: 'global_settings' });

    if (!team || !settings) {
      return res.status(404).json({ message: 'Team or settings not found' });
    }
    
    const currentRound = getCompetitionStatus(team, pastSubmissions, settings);

    res.status(200).json({
      team,
      currentRound,
      pastSubmissions,
      settings
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};