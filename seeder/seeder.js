// server/seeder/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Team = require('../models/Team.model');
const Settings = require('../models/Settings.model'); // <-- ADD THIS
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to database
connectDB();

const importAdmin = async () => {
  try {
    // --- ADD THIS BLOCK ---
    // Create default settings if they don't exist
    const existingSettings = await Settings.findOne({ singleton: 'global_settings' });
    if (!existingSettings) {
      await new Settings().save();
      console.log('Default settings created.');
    }
    // --- END BLOCK ---

    // --- 1. Define Your Admin Credentials ---
    const ADMIN_EMAIL = 'admin@nits.ac.in';
    const ADMIN_PASSWORD = 'supersecurepassword123';
    const ADMIN_NAME = 'Head Organizer';
    const ADMIN_TEAM_NAME = 'AdminTeam';
    // ------------------------------------------

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      console.log('Admin user already exists.');
      process.exit();
    }

    // 2. Create the Admin User
    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: 'admin',
    });
    await adminUser.save();

    // 3. Hash Password & Create the Admin's "Team"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const adminTeam = new Team({
      teamName: ADMIN_TEAM_NAME,
      password: hashedPassword,
      leader: adminUser._id,
      members: [adminUser._id],
      paymentStatus: 'Verified',
    });
    await adminTeam.save();
    
    // 4. Link the admin user to their new team
    adminUser.team = adminTeam._id;
    await adminUser.save();

    console.log('✅ Admin Account Created Successfully!');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importAdmin();