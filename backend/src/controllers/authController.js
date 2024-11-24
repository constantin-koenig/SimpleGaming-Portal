const User = require('../models/user.js');
const { createTokens } = require("../middleware/authMiddleware");
const axios = require('axios');

exports.loginWithDiscord = async (req, res, discordToken, discordRefreshToken) => {
  try {
    // Hole die Discord-Nutzerdaten mit dem erhaltenen Token
    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${discordToken}`,
      },
    });
    const discordData = userResponse.data;

    // Suche nach einem bestehenden Benutzer basierend auf der Discord-ID
    let user = await User.findOne({ discordID: discordData.id });

    if (!user) {
      // Prüfe, ob der Benutzer der erste in der Datenbank ist
      const userCount = await User.countDocuments();
      const isFirstUser = userCount === 0;

      // Erstelle einen neuen Benutzer, falls keiner gefunden wurde
      user = new User({
        discordID: discordData.id,
        username: discordData.global_name,
        avatar: discordData.avatar ? discordData.avatar : null,  // Setze auf null, falls kein Avatar vorhanden ist
        email: discordData.email,
        refreshToken: discordRefreshToken,
        role: isFirstUser ? 'admin' : 'user',  // Wenn erster Benutzer, setze Rolle auf 'admin'
      });

      await user.save();
      console.log("Neuer Benutzer wurde erstellt.");
    } else {
      // Check if the user data has changed
      let updated = false;

      if (user.username !== discordData.global_name) {
        user.username = discordData.global_name;
        updated = true;
      }

      // Avatar-Update nur bei Änderungen und falls nicht null
      if (discordData.avatar && user.avatar !== discordData.avatar) {
        user.avatar = discordData.avatar;
        updated = true;
      }

      // Email-Update nur bei Änderungen und falls nicht null
      if (discordData.email && user.email !== discordData.email) {
        user.email = discordData.email;
        updated = true;
      }

      if (discordRefreshToken && user.refreshToken !== discordRefreshToken) {
        user.refreshToken = discordRefreshToken;
        updated = true;
      }

      // Speichern nur bei Änderungen
      if (updated) {
        await user.save();
        console.log("Benutzerinformationen wurden aktualisiert.");
      }
    }

    // Token generieren
    const { accessToken, refreshToken } = createTokens(user);

    // Gebe das JWT-Token an das Frontend zurück
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (error) {
    console.error("Fehler bei der Authentifizierung:", error);
    res.status(500).json({ message: "Fehler bei der Authentifizierung mit Discord" });
  }
};
