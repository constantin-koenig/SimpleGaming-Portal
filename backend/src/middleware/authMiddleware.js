// src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const axios = require('axios');

// Token erstellen (Access-Token und Refresh-Token)
exports.createTokens = (user) => {
  // Access Token (kurzlebig)
  const accessToken = jwt.sign(
    {
      id: user.discordID,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarURL: user.avatarURL,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }  // Token läuft nach 5 Minuten ab
  );

  // Refresh Token (langfristig)
  const refreshToken = jwt.sign(
    { refreshToken: user.refreshToken },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }  // Refresh Token läuft nach 30 Tagen ab
  );

  return { accessToken, refreshToken };
};

// Token überprüfen und ggf. erneuern
exports.checkToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({ message: "Authorization header fehlt" });
  }

  // Überprüfen, ob das Format "Bearer <Token>" ist
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ message: "Token-Format ist ungültig. Erwartet: Bearer <Token>" });
  }

  const token = authHeader.split(" ")[1];
  const refreshToken = authHeader.split(" ")[2];

  if (!token && !refreshToken) {
    console.log("kein Token")
    return res.status(401).json({ message: "Nicht authentifiziert" });
  }

  try {
    // Versuche, das Access Token zu validieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next(); // Token ist gültig, weiter zur nächsten Middleware
  } catch (err) {
    // Falls das Access-Token abgelaufen ist, versuche das Refresh-Token zu verwenden
    if (refreshToken) {
      const decodedToken = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      try {
        // Erneuere das Access-Token mit dem Refresh-Token
        const discordUser = await renewToken(decodedToken.refreshToken);
        const user = await User.findOne({ discordID: discordUser.id });
        let updated = false;

        // Prüfen und Aktualisieren von Benutzerinformationen
        if (user.username !== discordUser.global_name) {
          user.username = discordUser.global_name;
          updated = true;
        }
        if (discordUser.avatar && user.avatar !== discordUser.avatar) {
          user.avatar = discordUser.avatar;
          updated = true;
        }
        if (discordUser.email && user.email !== discordUser.email) {
          user.email = discordUser.email;
          updated = true;
        }

        if (updated) {
          await user.save();
          console.log("Benutzerinformationen wurden aktualisiert.");
        }
        // Neue Tokens erstellen
        const { accessToken, refreshToken: newRefreshToken } = this.createTokens(user);
        return res.json({ accessToken: accessToken, refreshToken: newRefreshToken });
      } catch (err) {
        console.log("kein discord token erneuerung fehler", err)
        return res.status(401).json({ message: "Fehler bei der Token-Erneuerung" });
      }
    } else {
      return res.status(401).json({ message: "kein Refreshtoken" });
    }
  }
};


// Erneut Token holen und Benutzerinformationen von Discord abrufen
async function renewToken(refreshToken) {
  try {
    const response = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    const oauthData = await response.data;

    // Benutzerinformationen von Discord abrufen
    const discordResponse = await axios.get("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bearer ${oauthData.access_token}`, // Bearer Token für Authentifizierung
      },
    });
    
    const user = await User.findOne({ discordID: discordResponse.data.id });
    user.refreshToken = oauthData.refresh_token;
    await user.save();
    return discordResponse.data;
  } catch (err) {
    console.log("Fehler bei der Erneuerung des Tokens:", err);
    throw err;
  }
}

// Werte aus dem Token lesen
exports.parseToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      avatarURL: decoded.avatarURL,
    };
  } catch (err) {
    console.error("Token konnte nicht geparst werden:", err);
    return null;
  }
};
