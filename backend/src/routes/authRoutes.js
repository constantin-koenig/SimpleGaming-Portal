// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const authController = require("../controllers/authController");
const { request } = require('undici');

router.post("/discord", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Discord-ID oder Code fehlt" });
  }

  try {
    const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/discord/callback`,
        scope: 'identify',
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const oauthData = await tokenResponseData.body.json();
    console.log("oauthData");
    console.log(oauthData);
    return authController.loginWithDiscord(req, res, oauthData.access_token);
  } catch (error) {
    // NOTE: An unauthorized token will not throw an error
    // tokenResponseData.statusCode will be 401
    console.error(error);
  }
});

module.exports = router;
