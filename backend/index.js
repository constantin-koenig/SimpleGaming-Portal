const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/database');
const cors = require('cors');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoutes');
const { initializeSystem } = require('./utils/seed');

initializeSystem();

const app = express();
app.use(cookieParser());

// Middleware, um JSON im Request-Body zu parsen
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
connectDB();

// CORS
const corsOptions = {
    origin: 'http://localhost:5173', // Frontend-Domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cookies erlauben
};

app.use(cors(corsOptions));

// API routes
app.use('/api/auth', authRoutes);

app.use('/api/protected', protectedRoutes);

app.get('/', (req, res) => res.send('Backend is running!'));

app.listen(PORT, () => console.log(`Server runs on http://localhost:${PORT}`));

require('./jobs/updateUserData');
require('./jobs/cleanupOldSessions');

