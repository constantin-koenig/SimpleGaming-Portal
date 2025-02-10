const Role = require("../models/Roles");
const UserRole = require("../models/User_Role");
const Permission = require("../models/Permissions");
const RolePermission = require("../models/Role_Permissions");

/**
 * Prüft, ob der aktuell authentifizierte Benutzer (basierend auf seinen Rollen)
 * an der Zielrolle (über req.params.roleId) Änderungen vornehmen darf.
 * Annahme: Ein niedrigerer numerischer Priority-Wert entspricht einer höheren Berechtigung.
 */
const checkRoleHierarchy = async (req, res, next) => {
  try {
    if (req.params.roleId) {
        // Zielrolle anhand der roleId laden
        const targetRole = await Role.findById(req.params.roleId);
        if (!targetRole) {
        return res.status(404).json({ message: "Rolle nicht gefunden" });
        }

        // Alle Rollen des aktuell authentifizierten Benutzers abrufen
        const userRoles = await UserRole.find({ user: req.user._id }).populate("role");
        if (!userRoles || userRoles.length === 0) {
        return res.status(403).json({ message: "Keine Rollen für den aktuellen Benutzer gefunden" });
        }

        // Bestimme die effektivste Rolle (kleinster numerischer Wert = höchste Berechtigung)
        const effectivePriority = userRoles.reduce((min, userRole) => {
        if (userRole.role && typeof userRole.role.priority === "number") {
            return userRole.role.priority < min ? userRole.role.priority : min;
        }
        return min;
        }, Infinity);

        if (effectivePriority >= targetRole.priority) {
            return res.status(403).json({ message: "Unzureichende Berechtigung für diese Aktion" });
        }

        req.targetRole = targetRole;
        next();
    }
    else if (req.body.priority) {

         // Alle Rollen des aktuell authentifizierten Benutzers abrufen
         const userRoles = await UserRole.find({ user: req.user._id }).populate("role");
         if (!userRoles || userRoles.length === 0) {
         return res.status(403).json({ message: "Keine Rollen für den aktuellen Benutzer gefunden" });
         }
 
         // Bestimme die effektivste Rolle (kleinster numerischer Wert = höchste Berechtigung)
         const effectivePriority = userRoles.reduce((min, userRole) => {
         if (userRole.role && typeof userRole.role.priority === "number") {
             return userRole.role.priority < min ? userRole.role.priority : min;
         }
         return min;
         }, Infinity);
         if (effectivePriority >= req.body.priority) {
            return res.status(403).json({ message: "Unzureichende Berechtigung für diese Aktion" });
        }
        next();
    }

   
  } catch (error) {
    res.status(500).json({ message: "Fehler bei der Überprüfung der Rangordnung", error });
  }
};

// Ausnahme da es nur um das hinzufügen von Benutzern zu Rollen geht
const checkRoleHierarchyForAddingUserToRole = async (req, res, next) => {
    try {

      const targetRole = await Role.findById(req.params.roleId);
      if (!targetRole) {
        return res.status(404).json({ message: "Rolle nicht gefunden" });
      }
  

      const userRoles = await UserRole.find({ user: req.user._id }).populate("role");
      if (!userRoles || userRoles.length === 0) {
        return res.status(403).json({ message: "Keine Rollen für den aktuellen Benutzer gefunden" });
      }

      const effectivePriority = userRoles.reduce((min, userRole) => {
        if (userRole.role && typeof userRole.role.priority === "number") {
          return userRole.role.priority < min ? userRole.role.priority : min;
        }
        return min;
      }, Infinity);

      // Wenn der Benutzer über die Superadminberechtigungen verfügt, kann er weitere Superadmins hinzufügen
      if (effectivePriority >= targetRole.priority && effectivePriority !== 0) {
        return res.status(403).json({ message: "Unzureichende Berechtigung für diese Aktion" });
      }
      req.targetRole = targetRole;
      next();
    } catch (error) {
      res.status(500).json({ message: "Fehler bei der Überprüfung der Rangordnung", error });
    }
  };


const checkPermissionHierarchy = async (req, res, next) => {
  try {
    const { permissionId } = req.body;
    if (!permissionId) {
      return res.status(400).json({ message: "permissionId ist erforderlich" });
    }

    // Hole das Permission-Objekt anhand der permissionId
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Berechtigung nicht gefunden" });
    }

    // Alle Rollen des aktuell authentifizierten Benutzers abrufen
    const userRoles = await UserRole.find({ user: req.user._id }).populate("role");
    if (!userRoles || userRoles.length === 0) {
      return res.status(403).json({ message: "Keine Rollen für den aktuellen Benutzer gefunden" });
    }

    // Bestimme die effektivste Rolle des Benutzers
    const effectivePriority = userRoles.reduce((min, userRole) => {
      if (userRole.role && typeof userRole.role.priority === "number") {
        return userRole.role.priority < min ? userRole.role.priority : min;
      }
      return min;
    }, Infinity);

    // Zum Setzen der Berechtigung muss der Benutzer über eine höhere Berechtigung verfügen
    // als der Priority-Wert der zu setzenden Berechtigung.
    if (effectivePriority >= permission.priority) {
      return res.status(403).json({ message: "Unzureichende Berechtigung, um diese Berechtigung zu setzen" });
    }

    req.permission = permission;
    next();
  } catch (error) {
    res.status(500).json({ message: "Fehler bei der Überprüfung der Berechtigungshierarchie", error });
  }
};

/**
 * Diese Funktion ermittelt für ein Ziel (z. B. bei GET /:roleId/permissions)
 * zwei Sätze von Daten:
 *  1. Alle zugehörigen RolePermissions (allgemein)
 *  2. Diejenigen, die der aktuelle Benutzer basierend auf seiner Hierarchie bearbeiten darf
 *
 * Voraussetzung:
 *  - Die Zielrolle wird über req.params.roleId bestimmt.
 *  - Die aktuell authentifizierte Benutzer-ID liegt in req.user._id.
 *  - Im Permission-Modell existiert ein Feld "priority".
 *
 * Hinweis: Bei der Owner-Rolle (Priority 0) ist meist keine Änderung möglich.
 */
const enrichRolePermissions = async (req, res, next) => {
  try {
    // Zielrolle laden
    const targetRole = await Role.findById(req.params.roleId);
    if (!targetRole) {
      return res.status(404).json({ message: "Rolle nicht gefunden" });
    }
    // Alle RolePermissions für die Zielrolle abrufen und das Permission-Objekt mit einbinden
    const rolePermissions = await RolePermission.find({ role: req.params.roleId }).populate("permission");

    // Effektive Berechtigung des Benutzers ermitteln (kleinster Priority-Wert)
    const userRoles = await UserRole.find({ user: req.user._id }).populate("role");
    let effectivePriority = Infinity;
    if (userRoles && userRoles.length > 0) {
      effectivePriority = userRoles.reduce((min, ur) => {
        if (ur.role && typeof ur.role.priority === "number") {
          return ur.role.priority < min ? ur.role.priority : min;
        }
        return min;
      }, Infinity);
    }

    if (targetRole.priority <= effectivePriority) {
        req.rolePermissions = rolePermissions;
        req.editablePermissions = [];
        next();
    }

    const editableRolePermissions = await Permission.find({ priority: {$gt: effectivePriority, $gte: targetRole.priority } });

    // Beide Datensätze für das Frontend zur Verfügung stellen
    req.rolePermissions = rolePermissions;
    req.editablePermissions = editableRolePermissions;
    next();
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Anreichern der Berechtigungen", error });
  }
};

module.exports = {
  checkRoleHierarchy,
  checkRoleHierarchyForAddingUserToRole,
  checkPermissionHierarchy,
  enrichRolePermissions,
};
