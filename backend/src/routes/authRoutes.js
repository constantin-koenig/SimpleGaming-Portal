// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");
const { parseToken } = require("../middleware/authMiddleware");
const { checkToken } = require("../middleware/authMiddleware");
const axios = require('axios');

router.post("/discord", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Discord-ID oder Code fehlt" });
  }

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/discord/callback`,
        scope: 'identify',
      }).toString(), 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const oauthData = await tokenResponse.data;
    return authController.loginWithDiscord(req, res, oauthData.access_token, oauthData.refresh_token);
  } catch (error) {
    // NOTE: An unauthorized token will not throw an error
    // tokenResponseData.statusCode will be 401
    console.error(error);
  }
});

router.get("/userinfo", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({ message: "Authorization header fehlt" });
  }

  // Überprüfen, ob das Format "Bearer <Token>" ist
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ message: "Token-Format ist ungültig. Erwartet: Bearer <Token>" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = parseToken(token);  // Benutzerinformationen aus dem Token extrahieren

    if (!user) {
      return res.status(401).json({ message: "Ungültiges oder abgelaufenes Token" });
    }

    // Erfolgreiche Antwort mit Benutzerinformationen
    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarURL: user.avatarURL,
    });
  } catch (err) {
    console.error("Fehler beim Verarbeiten des Tokens:", err);
    return res.status(401).json({ message: "Fehler beim Verarbeiten des Tokens" });
  }
});

router.get("/check", checkToken, (req, res) => {
  res.status(200).json({ message: "Token ist gültig", user: req.user });
});



module.exports = router;
