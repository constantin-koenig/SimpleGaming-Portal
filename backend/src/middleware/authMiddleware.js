// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Nicht authentifiziert" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token ungültig" });
  }
};

exports.hasRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ message: "Zugriff verweigert" });
    next();
  };
};
