// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const Role = require("../models/Roles");
const Permission = require("../models/Permissions");
const RolePermission = require("../models/Role_Permissions");
const UserRole= require("../models/User_Role");
const User= require("../models/User");

router.get("/user/userinfo",
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

// 📌 1️⃣ Alle Benutzer abrufen
router.get("/users", authMiddleware,  requirePermission(["view_users"]), async (req, res) => {
  try {
    // Alle Benutzer aus der Datenbank abrufen
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Benutzerliste", error });
  }
});

// 📌 1️⃣ Mitglieder einer Rolle abrufen
router.get("/roles/:roleId/members", authMiddleware, requirePermission(["manage_roles", "manage_users"]), async (req, res) => {
  try {
    const { roleId } = req.params;

    // Finde alle User-Rollen-Verknüpfungen für diese Rolle
    const userRoles = await UserRole.find({ role: roleId }).populate("user");
 
    // Extrahiere die Benutzer
    const members = userRoles.map((ur) => ur.user);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Rollen-Mitglieder", error });
  }
});

// 📌 2️⃣ Benutzer zu einer Rolle hinzufügen
router.post("/roles/:roleId/members", authMiddleware, requirePermission(["manage_roles", "manage_users"]), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID ist erforderlich" });
    }

    // Prüfen, ob die Rolle existiert
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Rolle nicht gefunden" });
    }


    // Prüfen, ob der Benutzer bereits in der Rolle ist
    const existingUserRole = await UserRole.findOne({ user: userId, role: roleId });
    if (existingUserRole) {
      return res.status(400).json({ message: "Benutzer ist bereits in dieser Rolle" });
    }

    // Benutzer zur Rolle hinzufügen
    const newUserRole = new UserRole({ user: userId, role: roleId });
    await newUserRole.save();

    res.status(201).json({ message: "Benutzer erfolgreich zur Rolle hinzugefügt", userRole: newUserRole });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Hinzufügen des Benutzers zur Rolle", error });
  }
});

// 📌 3️⃣ Benutzer aus einer Rolle entfernen
router.delete("/roles/:roleId/members/:userId", authMiddleware, requirePermission(["manage_roles", "manage_users"]), async (req, res) => {
  try {
    const { roleId, userId } = req.params;

    // Prüfen, ob die Rolle existiert
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "Rolle nicht gefunden" });
    }

    // Benutzer aus der Rolle entfernen
    const deletedUserRole = await UserRole.findOneAndDelete({ user: userId, role: roleId });

    if (!deletedUserRole) {
      return res.status(404).json({ message: "Benutzer nicht in dieser Rolle gefunden" });
    }

    res.json({ message: "Benutzer erfolgreich aus der Rolle entfernt" });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Entfernen des Benutzers aus der Rolle", error });
  }
});


// 📌 1️⃣ Eine neue Rolle erstellen
router.post("/roles",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name ist erforderlich" });

      const role = new Role({ name: name, priority: 2 });
      await role.save();

      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Erstellen der Rolle", error });
    }
  }
);

// 📌 2️⃣ Alle Rollen anzeigen
router.get(
  "/roles",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const roles = await Role.find();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Rollen", error });
    }
  }
);

// 📌 3️⃣ Eine Rolle bearbeiten
router.put(
  "/roles/:roleId",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { name } = req.body.roleData;
      const { roleId } = req.params;

      const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        { name },
        { new: true }
      );

      if (!updatedRole) return res.status(404).json({ message: "Rolle nicht gefunden" });

      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Bearbeiten der Rolle", error });
    }
  }
);

// 📌 4️⃣ Eine Rolle löschen
router.delete(
  "/roles/:roleId",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { roleId } = req.params;

      // 🛑 Überprüfe, ob die Rolle mit priority 0 geschützt ist
      const roleToDelete = await Role.findById(roleId);
      if (!roleToDelete) {
        return res.status(404).json({ message: "Rolle nicht gefunden" });
      }

      if (roleToDelete.priority === 0) {
        return res.status(403).json({ message: "Diese Rolle kann nicht gelöscht werden" });
      }

      // ✅ Rolle darf gelöscht werden
      await Role.findByIdAndDelete(roleId);
      await RolePermission.deleteMany({ role: roleId });
      await UserRole.deleteMany({ role: roleId });

      res.json({ message: "Rolle erfolgreich gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Löschen der Rolle", error });
    }
  }
);


// 📌 5️⃣ Berechtigungen einer Rolle anzeigen
router.get(
  "/roles/:roleId/permissions",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const rolePermissions = await RolePermission.find({ role: roleId }).populate("permission");
      res.json(rolePermissions);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Berechtigungen", error });
    }
  }
);

// 📌 6️⃣ Berechtigung einer Rolle hinzufügen
router.post(
  "/roles/:roleId/permissions",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { permissionId, action } = req.body;
      const { roleId } = req.params;
      if (!permissionId || !action || !["allow", "deny"].includes(action)) {
        return res.status(400).json({ message: "Ungültige Parameter" });
      }

      let rolePermission = await RolePermission.findOne({ role: roleId, permission: permissionId });
      if (rolePermission) {
        rolePermission.effect = action;
        await rolePermission.save();
      } else {
        rolePermission = new RolePermission({ role: roleId, permission: permissionId, effect: action });
        await rolePermission.save();
      }

      res.json(rolePermission);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Hinzufügen/Aktualisieren der Berechtigung", error });
    }
  }
);

// 🔹 Berechtigung von einer Rolle entfernen
router.delete(
  "/roles/:roleId/permissions/:permissionId",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;
      const deleted = await RolePermission.findOneAndDelete({ role: roleId, permission: permissionId });
      if (!deleted) return res.status(404).json({ message: "Berechtigung nicht gefunden" });
      res.json({ message: "Berechtigung erfolgreich entfernt" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Entfernen der Berechtigung", error });
    }
  }
);

// 🔹 Alle Berechtigungen abrufen
router.get(
  "/permissions",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const permissions = await Permission.find();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Abrufen der Berechtigungen", error });
    }
  }
);



module.exports = router;
