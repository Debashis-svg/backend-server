const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// ✅ Fix: Allow multiple origins dynamically
const allowedOrigins = [
  'https://software-project-light-eu92.vercel.app/',
  'https://software-project-light.onrender.com',
  'http://localhost:5173' // optional for local dev
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Increase the request body size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API Routes ---
app.get('/api', (req, res) => {
  res.send('Hackathon 2026 API is running...');
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/test', require('./routes/test.routes'));
app.use('/api/verify', require('./routes/verify.routes.js'));
app.use('/api/certificate', require('./routes/certificate.routes.js'));

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
