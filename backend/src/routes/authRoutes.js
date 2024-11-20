// src/routes/authRoutes.js
const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Authentifizierungsrouten
router.get("/discord", passport.authenticate("discord"));
router.get("/discord/callback", passport.authenticate("discord", {
  failureRedirect: "/",
}), (req, res) => {
  // Hier erfolgt die Weiterleitung nach erfolgreichem Login
  const token = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.cookie("access_token", token, { httpOnly: true });
  res.redirect("/dashboard");  // Oder wo du nach erfolgreichem Login hinleiten willst
});

// Refresh Token Route zum Erneuern des Access Tokens
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(403).json({ message: "Refresh Token fehlt" });
  }

  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Ungültiges Refresh Token" });

    const newAccessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",  // Neuer Access Token mit 1 Stunde Gültigkeit
    });

    res.cookie("access_token", newAccessToken, { httpOnly: true });
    res.status(200).json({ message: "Access Token erneuert" });
  });
});

module.exports = router;
