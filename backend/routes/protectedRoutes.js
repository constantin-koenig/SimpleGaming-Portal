// routes/protectedRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const Role = require("../models/Roles");
const Permission = require("../models/Permissions");
const RolePermission = require("../models/Role_Permissions");

// Beispiel: Nur User mit "view_account" Permission
router.get('/user/dashboard', 
  authMiddleware,
  requirePermission(['user_view_dashboard']), 
  (req, res) => {
    res.send('Willkommen auf deiner Dashboard-Seite!');
  }
);

router.get(
  "/user/userinfo",
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

// 📌 1️⃣ Eine neue Rolle erstellen
router.post(
  "/roles",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name ist erforderlich" });

      const role = new Role({ name });
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
      const { name } = req.body;
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

      const deletedRole = await Role.findByIdAndDelete(roleId);
      if (!deletedRole) return res.status(404).json({ message: "Rolle nicht gefunden" });

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

      const rolePermissions = await RolePermission.find({ roleId }).populate("permissionId");
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
      const { roleId } = req.params;
      const { permissionId } = req.body;

      const rolePermission = new RolePermission({ roleId, permissionId });
      await rolePermission.save();

      res.status(201).json(rolePermission);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Hinzufügen der Berechtigung", error });
    }
  }
);

// 📌 7️⃣ Berechtigung einer Rolle entfernen
router.delete(
  "/roles/:roleId/permissions/:permissionId",
  authMiddleware,
  requirePermission(["manage_roles"]),
  async (req, res) => {
    try {
      const { roleId, permissionId } = req.params;

      const deletedPermission = await RolePermission.findOneAndDelete({ roleId, permissionId });
      if (!deletedPermission) return res.status(404).json({ message: "Berechtigung nicht gefunden" });

      res.json({ message: "Berechtigung erfolgreich entfernt" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Entfernen der Berechtigung", error });
    }
  }
);



module.exports = router;
