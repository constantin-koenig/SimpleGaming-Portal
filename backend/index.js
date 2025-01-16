const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/database');

require('dotenv').config();

Object.keys(require.cache).forEach(key => delete require.cache[key]);

const authRoutes = require('./routes/auth');

const app = express();
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

// MongoDB connection
connectDB();


// API routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('Backend is running!'));

app.listen(PORT, () => console.log(`Server runs on http://localhost:${PORT}`));

require('./jobs/updateUserData');
require('./jobs/cleanupOldSessions'); 
