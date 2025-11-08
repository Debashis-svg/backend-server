// server/controllers/payment.controller.js
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  const { amount, teamName } = req.body;

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_team_${teamName.replace(/\s/g, '_')}_${Date.now()}`,
    notes: {
      teamName: teamName,
      description: "Hackathon 2026 Registration Fee"
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }
    res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};