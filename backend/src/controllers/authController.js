// src/controllers/authController.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

exports.loginWithDiscord = async (req, res, discordToken) => {
  console.error("Wir sind jetzt in AuthController")
  try {
    // Hole die Discord-Nutzerdaten mit dem erhaltenen Token
    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${discordToken}`,
      },
    });
    console.error("DAS IST DIE AUSGABE!");
    console.error(userResponse);
    const discordData = userResponse.data;

    // Suche nach einem bestehenden Benutzer basierend auf der Discord-ID
    let user = await User.findOne({ discordId: discordData.id });

    if (!user) {
      // Erstelle einen neuen Benutzer, falls keiner gefunden wurde
      user = new User({
        discordId: discordData.id,
        username: discordData.username,
        avatar: discordData.avatar,
        email: discordData.email,
        role: 'user',  // Standardrolle
      });
      await user.save();
    }

    // Erstelle ein JWT-Token für den authentifizierten Benutzer
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Gebe das JWT-Token an das Frontend zurück
    res.json({ token: jwtToken });
  } catch (error) {
    console.error("Fehler bei der Authentifizierung:", error);
    res.status(500).json({ message: "Fehler bei der Authentifizierung mit Discord" });
  }
};
