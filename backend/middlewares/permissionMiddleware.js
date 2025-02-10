const UserRole = require('../models/User_Role');
const RolePermission = require('../models/Role_Permissions');
const Permission = require('../models/Permissions');
const User = require('../models/User');

/**
 * 🔍 Holt alle Berechtigungen eines Nutzers basierend auf seinen Rollen
 */
async function getUserPermissions(userId) {
  const user = await User.findById( userId );
  if (!user) {
    console.log('User not found');
    return { allowed: new Set(), denied: new Set() };
  }

  // 1️⃣ Rollen des Users finden (User_Role)
  const userRoles = await UserRole.find({ user: user._id }).populate('role');
  if (!userRoles || userRoles.length === 0) {
    return { allowed: new Set(), denied: new Set() }; // Kein Zugriff, wenn keine Rollen vorhanden
  }

  // 2️⃣ Rollen-Permissions abrufen
  const roleIds = userRoles.map(ur => ur.role._id);
  const rpList = await RolePermission.find({ role: { $in: roleIds } }).populate('permission');

  // 3️⃣ Erstelle Sets für erlaubte und verbotene Berechtigungen
  const allowed = new Set();
  const denied = new Set();

  rpList.forEach(rp => {
    const permName = rp.permission.name;
    if (rp.effect === 'allow') {
      allowed.add(permName);
    } else if (rp.effect === 'deny') {
      denied.add(permName);
    }
  });

  return { allowed, denied };
}

/**
 * 🛑 `requirePermission` prüft, ob ALLE angegebenen Berechtigungen benötigt werden
 */
function requirePermission(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      if (!req.userId) return res.status(401).send('User not authenticated');

      const { allowed, denied } = await getUserPermissions(req.userId);

      for (const needed of requiredPermissions) {
        if (denied.has(needed)) return res.status(403).send(`Permission denied: ${needed}`);
        if (!allowed.has(needed)) return res.status(403).send(`Missing permission: ${needed}`);
      }

      next(); // Alle Berechtigungen erfüllt, weiter zur Route
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      return res.status(500).send('Internal server error');
    }
  };
}

/**
 * 🔄 `requirePermissionOr` prüft, ob MINDESTENS EINE der angegebenen Berechtigungen vorhanden ist
 */
function requirePermissionOr(permissions = []) {
  return async (req, res, next) => {
    try {
      if (!req.userId) return res.status(401).send('User not authenticated');

      const { allowed, denied } = await getUserPermissions(req.userId);

      for (const perm of permissions) {
        if (allowed.has(perm) && !denied.has(perm)) {
          return next(); // Sobald eine Berechtigung zutrifft, geht es weiter
        }
      }

      return res.status(403).send('Permission denied');
    } catch (error) {
      console.error('Error in requirePermissionOr middleware:', error);
      return res.status(500).send('Internal server error');
    }
  };
}

/**
 * ✅ `hasPermission` erlaubt einfache "inline" Berechtigungsprüfungen
 */
async function hasPermission(userId, requiredPermissions = []) {
  const { allowed, denied } = await getUserPermissions(userId);
  for (const perm of requiredPermissions) {
    if (denied.has(perm)) return false;
    if (allowed.has(perm)) return true;
  }
  return false;
}

module.exports = {
  requirePermission,
  requirePermissionOr,
  hasPermission
};
