const cron = require('node-cron');
const mongoose = require('mongoose');
const OwnRefreshToken = require('../models/OwnRefreshTokens');

require('dotenv').config();

// clean up old sessions
const deleteOldSessions = async () => {
    try {
        const now = new Date();
        const result = await OwnRefreshToken.deleteMany({ expiresAt: { $lt: now } });
        console.log(`Deleted ${result.deletedCount} expired refresh tokens.`);
    } catch (error) {
        console.error('Error cleaning up old sessions:', error.message);
    }
};

// Cron-Job: All 30 minutes
cron.schedule('*/30 * * * *', async () => {
    console.log('Starting cleanup of old sessions (every 30 minutes)...');
    await deleteOldSessions();
    console.log('Cleanup completed.');
});

module.exports = deleteOldSessions;
