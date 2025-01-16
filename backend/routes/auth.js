// Imports
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');

// Models
const User = require('../models/User');
const DiscordRefreshToken = require('../models/DiscordRefreshToken');
const OwnRefreshToken = require('../models/OwnRefreshTokens');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Discord URLs
const DISCORD_AUTH_URL = "https://discord.com/api/oauth2/authorize";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_API_URL = "https://discord.com/api/users/@me";

// Token expiration time
const tokenValidityDays = 30;

// Discord login route
router.get('/discord', (req, res) => {
    const redirectUri = `${DISCORD_AUTH_URL}?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.DISCORD_REDIRECT_URI}&response_type=code&scope=email+identify`;
    res.redirect(redirectUri);
});

// Discord callback route
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No code provided!');
    }

    try {
        // Exchange code for access and refresh tokens
        const tokenResponse = await axios.post(DISCORD_TOKEN_URL, new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token} = tokenResponse.data;
        const discord_refresh_token = refresh_token;
        // Fetch user data from Discord
        const userResponse = await axios.get(DISCORD_API_URL, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;

         // Check if user exists
         let user = await User.findOne({ discordId: userData.id });

         if (user) {
             // Check if updates are needed
             let updates = false;
 
             if (user.username !== userData.username) {
                 user.username = userData.username;
                 updates = true;
             }
             if (user.email !== userData.email) {
                 user.email = userData.email;
                 updates = true;
             }
             if (user.discriminator !== userData.discriminator) {
                 user.discriminator = userData.discriminator;
                 updates = true;
             }
             if (user.avatar !== userData.avatar) {
                 user.avatar = userData.avatar;
                 updates = true;
             }
             if (updates) {
                 user.updatedAt = Date.now();
                 await user.save();
                 console.log(`User ${user.discordId} updated.`);
             } else {
                 console.log(`User ${user.discordId} already up-to-date.`);
             }
         } else {
             // Create new user
             user = new User({
                 discordId: userData.id,
                 username: userData.username,
                 email: userData.email,
                 discriminator: userData.discriminator,
                 avatar: userData.avatar,
             });
             await user.save();
             console.log(`New user created: ${user.discordId}`);
         }
 
         // Save Discord refresh token
         await DiscordRefreshToken.deleteMany({ discordId: userData.id });
         await DiscordRefreshToken.create({
             discordId: userData.id,
             token: encrypt(discord_refresh_token),
             expiresAt: new Date(Date.now() + tokenValidityDays * 24 * 60 * 60 * 1000),
         });

        // Generate JWT Access token
        const accessToken = jwt.sign({
            id: userData.id
        }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Generate own refresh token
        const generatedRefreshToken = crypto.randomBytes(64).toString('hex');
        const encryptedToken = encrypt(generatedRefreshToken);

        // Delete old tokens for the user
        await OwnRefreshToken.deleteMany({ userId: userData.id });

        // Save own refresh token
        await OwnRefreshToken.create({
            userId: userData.id,
            token: generatedRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 30 Tage gültig
        });

        // Generate JWT Refresh token
        const refreshToken = jwt.sign({ 
            token: encryptedToken 
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Send cookies and redirect
        res.cookie('access_token', accessToken, { httpOnly: true });
        res.cookie('refresh_token', refreshToken, { 
            httpOnly: true,
            path: 'http:localhost:5000/api/auth/refresh/' 
        });
        res.redirect('/');
    } catch (error) {
        if (error.response) {
            // If token was already used or is invalid
            if (error.response.status === 400) {
                console.error('Bad Request: ', error.response.data);
                res.redirect('/api/auth/discord');
            } else if (error.response.status === 401) {
                console.error('Unauthorized: ', error.response.data);
                return res.status(401).send('Unauthorized');
            }
        } else if (error.request) {
            // No response received
            console.error('No response received:', error.request);
            return res.status(500).send('No response from server');
        } else {
            // Other errors
            console.error('Error:', error.message);
            return res.status(500).send('An unexpected error occurred');
        }
    }
});

 // Refresh token function
 const verifyRefreshToken = async (req, res, next) => {
    try {
        // Get refresh token from cookies
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
            return res.status(401).send('Refresh token not provided');
        }

        // Decode the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const decryptedToken = decrypt(decoded.token);

        // Check if token exists
        const tokenRecord = await OwnRefreshToken.findOne({ token: decryptedToken });

        if (!tokenRecord) {
            return res.status(401).send('Refresh token not found or invalid');
        }

        // Check if token is expired
        if (new Date(tokenRecord.expiresAt) < new Date()) {
            await OwnRefreshToken.deleteMany({ userId: tokenRecord.userId }); // Lösche abgelaufene Tokens
            return res.status(401).send('Refresh token expired');
        }

        // Set user ID in request
        req.userId = tokenRecord.userId;

        next();
    } catch (error) {
        console.error(error.message);
        res.status(403).send('Invalid refresh token');
    }
};

// Token refresh route
router.post('/refresh', verifyRefreshToken, async (req, res) => {
    try {
        const userId = req.userId;

        // Generate new access token
        const user = await User.findOne({ discordId: userId });
        if (!user) {
            return res.status(404).send('User not found');
        }

        const newAccessToken = jwt.sign({
            id: user.discordId
        }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.cookie('access_token', newAccessToken, { httpOnly: true });
        res.status(200).send({ message: 'Access token refreshed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error refreshing token');
    }
});

module.exports = router;