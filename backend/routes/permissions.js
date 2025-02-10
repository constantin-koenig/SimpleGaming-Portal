// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermissionOr } = require('../middlewares/permissionMiddleware');
const Permission = require("../models/Permissions");

// 🔹 Alle Berechtigungen abrufen
router.get("/", authMiddleware, requirePermissionOr(["view_userPermissions", "manage_userPermissions", "manage_adminPermissions"]), async (req, res) => {
    try {
      const permissions = await Permission.find();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Berechtigungen", error });
    }
  }
);

module.exports = router;