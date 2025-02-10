const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission, hasPermission } = require('../middlewares/permissionMiddleware');
const User= require("../models/User");
const UserRole = require("../models/User_Role");

router.get("/me/userinfo",
  authMiddleware,
  requirePermission(["view_account"]),
  (req, res) => {
    
    const userInfo = req.user;

    if (!userInfo) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    res.json(userInfo);
  }
);

router.get("/", authMiddleware, async (req, res) => {
    try {
      // Benutzerberechtigungen prüfen
      const canManageAll = await hasPermission(req.userId, ["manage_allUsers"]);
      const canViewAll = await hasPermission(req.userId, ["view_allUsers"]);
  
      if (canManageAll) {
        const users = await User.find();
        return res.json(users);
      }
  
      if (canViewAll) {
        const users = await User.find().select('_id globalname discordId avatar');
        console.log("user" + users);
        return res.json(users);
      }
  
      return res.status(403).send('Permission denied');
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Benutzerliste", error });
    }
  });

  router.get("/me/priority", authMiddleware, async (req, res) => {
        try {
            const userRoles = await UserRole.find({ user: req.user._id }).populate("role");
            if (!userRoles || userRoles.length === 0) {
              return res.status(403).json({ message: "Keine Rollen für den aktuellen Benutzer gefunden" });
            }
        
            // Ermitteln der effektivsten Rolle (kleinster numerischer Wert = höchste Berechtigung)
            const effectivePriority = userRoles.reduce((min, userRole) => {
              if (userRole.role && typeof userRole.role.priority === "number") {
                return userRole.role.priority < min ? userRole.role.priority : min;
              }
              return min;
            }, Infinity);
            return res.json(effectivePriority);
        }
        catch (error) {
            res.status(500).json({ message: "Fehler beim Abrufen der Benutzerliste", error });
        }

  });

module.exports = router;