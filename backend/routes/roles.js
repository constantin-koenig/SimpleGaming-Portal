const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermissionOr } = require('../middlewares/permissionMiddleware');
const {checkRoleHierarchy, checkRoleHierarchyForAddingUserToRole, checkPermissionHierarchy, enrichRolePermissions } = require('../middlewares/hierarchyMiddleware');

const Role = require("../models/Roles");
const RolePermission = require("../models/Role_Permissions");
const UserRole = require("../models/User_Role");

// 📌 1️⃣ Mitglieder einer Rolle abrufen
router.get("/:roleId/members", authMiddleware, requirePermissionOr(["view_userMembership", "manage_userMembership", "manage_adminMembership"]), async (req, res) => {
  try {
    const { roleId } = req.params;
    const userRoles = await UserRole.find({ role: roleId }).populate("user");
    const members = userRoles.map((ur) => ur.user);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Rollen-Mitglieder", error });
  }
});

// 📌 2️⃣ Benutzer zu einer Rolle hinzufügen
router.post("/:roleId/members", authMiddleware, requirePermissionOr(["manage_userMembership", "manage_adminMembership"]), checkRoleHierarchyForAddingUserToRole, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID ist erforderlich" });
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
router.delete("/:roleId/members/:userId", authMiddleware, requirePermissionOr(["manage_userMembership", "manage_adminMembership"]), checkRoleHierarchyForAddingUserToRole, async (req, res) => {
  try {
    const { roleId, userId } = req.params;

    if (req.targetRole.priority == 0 && userId == req.userId) return res.status(403).json({ message: "Du kannst dich nicht selber aus dieser Rolle entfernen." });
    if (req.targetRole.name == 'User') return res.status(403).json({ message: "Aus dieser Rolle können keine User entfernt werden." });
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

// 📌 4️⃣ Eine neue Rolle erstellen
router.post("/", authMiddleware, requirePermissionOr(["manage_userRoles", "manage_adminRoles"]), checkRoleHierarchy, async (req, res) => {
  try {
    const { name, priority } = req.body;
    if (!name) return res.status(400).json({ message: "Name ist erforderlich" });
    
    // Neue Rolle darf nur mit einer niedrigeren Rangordnung (höherer numerischer Wert) als der aktuelle User erstellt werden
    
    const role = new Role({ name, priority });
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Erstellen der Rolle", error });
  }
});

// 📌 5️⃣ Alle Rollen anzeigen
router.get("/", authMiddleware, requirePermissionOr(["view_userRoles", "manage_userRoles", "manage_adminRoles"]), async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abrufen der Rollen", error });
  }
});

// 📌 6️⃣ Eine Rolle bearbeiten
router.put("/:roleId", authMiddleware, requirePermissionOr(["manage_userRoles", "manage_adminRoles"]), checkRoleHierarchy, async (req, res) => {
  try {
    const { name, priority } = req.body.roleData;
    const { roleId } = req.params;
    
    // Falls auch die Priority geändert werden soll, prüfen wir, ob der neue Wert zulässig ist.
    if (priority && req.targetRole.priority !== priority) {
      if (req.user.priority >= priority) {
        return res.status(403).json({ message: "Du kannst keine Rolle auf diese Priorität ändern" });
      }
    }
    const updatedRole = await Role.findByIdAndUpdate(roleId, {name, priority}, { new: true });
    if (!updatedRole) return res.status(404).json({ message: "Rolle nicht gefunden" });
    
    res.json(updatedRole);
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Bearbeiten der Rolle", error });
  }
});

// 📌 7️⃣ Eine Rolle löschen
router.delete("/:roleId", authMiddleware, requirePermissionOr(["manage_userRoles", "manage_adminRoles"]), checkRoleHierarchy, async (req, res) => {
  try {
    const { roleId } = req.params;
    const roleToDelete = req.targetRole;
    
    if (roleToDelete.name === 'Superuser' || roleToDelete.name === 'User') return res.status(403).json({ message: "Diese Rolle kann nicht gelöscht werden" });
    
    await Role.findByIdAndDelete(roleId);
    await RolePermission.deleteMany({ role: roleId });
    await UserRole.deleteMany({ role: roleId });
    
    res.json({ message: "Rolle erfolgreich gelöscht" });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Löschen der Rolle", error });
  }
});

// 📌 8️⃣ Berechtigungen einer Rolle anzeigen
router.get(
  "/:roleId/permissions",
  authMiddleware,
  requirePermissionOr(["view_userPermissions", "manage_userPermissions", "manage_adminPermissions"]),
  enrichRolePermissions,
  (req, res) => {
    // Hier liefern wir zwei Objekte:
    // - rolePermissions: Alle Berechtigungen der Rolle
    // - editablePermissions: Die Berechtigungen, die der aktuelle Benutzer bearbeiten darf
    res.json({
      rolePermissions: req.rolePermissions,
      editablePermissions: req.editablePermissions
    });
  }
);

// 📌 9️⃣ Berechtigung einer Rolle hinzufügen
router.post("/:roleId/permissions", authMiddleware, requirePermissionOr(["manage_userPermissions", "manage_adminPermissions"]), checkRoleHierarchy,checkPermissionHierarchy, async (req, res) => {
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
});

// 🔹 Berechtigung von einer Rolle entfernen
router.delete("/:roleId/permissions", authMiddleware, requirePermissionOr(["manage_userPermissions", "manage_adminPermissions"]), checkRoleHierarchy, checkPermissionHierarchy, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    const deleted = await RolePermission.findOneAndDelete({ role: roleId, permission: permissionId });
    if (!deleted) return res.status(404).json({ message: "Berechtigung nicht gefunden" });
    res.json({ message: "Berechtigung erfolgreich entfernt" });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Entfernen der Berechtigung", error });
  }
});

module.exports = router;
