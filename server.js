// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// --- Middlewares ---
app.use(cors({
  origin: [
    'https://software-project-lime.vercel.app/api', // your deployed frontend
    'http://localhost:5173/api',
  ] // Make sure this port is correct!
}));

// Increase the request body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API Routes ---
app.get('/api', (req, res) => {
  res.send('Hackathon 2026 API is running...');
});

// Auth Routes
app.use('/api/auth', require('./routes/auth.routes'));
// Payment Routes
app.use('/api/payment', require('./routes/payment.routes'));
// Question Routes (Admin)
app.use('/api/questions', require('./routes/question.routes'));
// Admin Routes (Dashboard, Team Mgmt, etc.)
app.use('/api/admin', require('./routes/admin.routes'));
// Dashboard Routes (Participant)
app.use('/api/dashboard', require('./routes/dashboard.routes'));
// Test Routes (Participant)
app.use('/api/test', require('./routes/test.routes'));
// Public Certificate Verification Route
app.use('/api/verify', require('./routes/verify.routes.js'));

// --- THIS IS THE MISSING ROUTE ---
app.use('/api/certificate', require('./routes/certificate.routes.js'));
// --- END OF FIX ---

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));