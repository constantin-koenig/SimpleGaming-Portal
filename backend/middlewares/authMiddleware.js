const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Prüfen, ob der Header existiert und korrekt ist
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Extrahieren des Tokens aus dem Header
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).send('No access token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ discordId: decoded.id });
    if (!user) {
      return res.status(404).send('User not found in database');
    }

    // Speichere im Request
    req.userId = user.discordId; 
    req.user = user;      // optional, dann hast du das User-Objekt direkt

    next();
  } catch (error) {
    console.error('Error verifying access token:', error.message);
    return res.status(401).send('Invalid access token');
  }
};
