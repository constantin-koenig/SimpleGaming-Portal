const express = require("express");
const User = require("../models/user.js"); // Dein User Model
const jwt = require("jsonwebtoken");
const router = express.Router();

// Middleware zum Überprüfen des JWT-Tokens
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Zugriff verweigert. Kein Token vorhanden." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Ungültiges Token" });
    req.user = user;
    next();
  });
};

// API-Endpunkt zum Abrufen der Benutzer
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await User.find(); // Alle Benutzer aus der DB
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzer" });
  }
});

module.exports = router;
