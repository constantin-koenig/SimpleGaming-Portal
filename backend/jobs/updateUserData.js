const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const DiscordRefreshToken = require('../models/DiscordRefreshToken');
const { encrypt, decrypt } = require('../utils/encryption');

require('dotenv').config();

// Discord URLs
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_API_URL = "https://discord.com/api/users/@me";

// Token expiration time
const tokenValidityDays = 30;

// User data update
const updateUserData = async () => {
    console.log('Starting user data update... Time: ' + new Date(Date.now()));
    const refreshTokens = await DiscordRefreshToken.find();

    for (const tokenData of refreshTokens) {
        try {
            // Check if token is expired
            if (new Date(tokenData.expiresAt) < now) {
                console.log(`Token for ${tokenData.discordId} is expired. Deleting...`);
                await RefreshToken.deleteMany({ discordId: tokenData.discordId });
                continue; // Skip to next token
            }

            // Fetch new access token
            const tokenResponse = await axios.post(DISCORD_TOKEN_URL, new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: decrypt(tokenData.token),
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, refresh_token } = tokenResponse.data;

            // Fetch updated user data
            const userResponse = await axios.get(DISCORD_API_URL, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const userData = userResponse.data;

            // Update user data
            await User.findOneAndUpdate(
                { discordId: userData.id },
                {
                    username: userData.username,
                    discriminator: userData.discriminator,
                    avatar: userData.avatar,
                    email: userData.email,
                    updatedAt: Date.now(),
                }
            );

            // Remove old refresh token and save the new one
            await DiscordRefreshToken.deleteMany({ discordId: userData.id });
            await DiscordRefreshToken.create({
                discordId: userData.id,
                token: encrypt(refresh_token),
                 expiresAt: new Date(Date.now() + tokenValidityDays * 24 * 60 * 60 * 1000),
            });
            
            console.log(`Updated user: ${userData.id}`);
        } catch (error) {
            console.error(`Failed to update user: ${tokenData.discordId}`, error);
        }
    }
};

// set Cron-Job
cron.schedule('*/30 * * * *', async () => {
    await updateUserData();
    console.log('Update completed. Time: ' + new Date (Date.now()));
});

module.exports = updateUserData;
