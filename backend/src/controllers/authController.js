// src/controllers/authController.js
const jwt = require("jsonwebtoken");

exports.loginSuccess = (req, res) => {
    const accessToken = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET, {
        expiresIn: "1h",  // Access Token läuft nach 1 Stunde ab
      });
      
      const refreshToken = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",  // Refresh Token läuft nach 7 Tagen ab
      });
      
      res.cookie("access_token", accessToken, { httpOnly: true });
      res.cookie("refresh_token", refreshToken, { httpOnly: true });      
  res.redirect("/dashboard");  // Weiterleitung zur Dashboard-Seite nach erfolgreichem Login
};
