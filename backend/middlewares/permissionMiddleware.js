// middlewares/permissionMiddleware.js

const UserRole = require('../models/User_Role');
const RolePermission = require('../models/Role_Permissions');
const Permission = require('../models/Permissions');
const User = require('../models/User');
const { use } = require('../routes/auth');

async function getUserPermissions(userId) {

  const user = await User.findOne({ discordId: userId });
  if (!user) {
    return console.log('User not found');
  }

  // 1. Rollen des Users finden (User_Role)
  const userRoles = await UserRole.find({ user: user._id }).populate('role');
  if (!userRoles || userRoles.length === 0) {
    // Keine Rollen → Keine Permissions
    return { allowed: new Set(), denied: new Set(), isOwner: false };
  }
  console.log(user._id);
  console.log("UserRollen" + userRoles.role);

  // Check, ob eine Rolle priority=1 hat
  const hasOwnerRole = userRoles.some(ur => ur.role.priority === 1);

  // Wenn User = Owner, geben wir gleich eine Info zurück
  if (hasOwnerRole) {
    return {
      allowed: new Set(), 
      denied: new Set(), 
      isOwner: true
    };
  }

  // 2. Ansonsten: Sammle alle RolePermissions
  const roleIds = userRoles.map(ur => ur.role._id);
  const rpList = await RolePermission
    .find({ role: { $in: roleIds } })
    .populate('permission'); // permission: { _id, name }

  // 3. Sets für allowed und denied
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

  return { allowed, denied, isOwner: false };
}

function requirePermission(permissions = []) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).send('User not authenticated');
      }

      // Effektive Permissions holen
      const { allowed, denied, isOwner } = await getUserPermissions(req.userId);

      // Falls User priority=1
      if (isOwner) {
        // Überspringe alle Checks und erlaube alles
        return next();
      }

      // Ansonsten: Prüfe jede Permission
      for (const needed of permissions) {
        // 1) "deny" hat Vorrang
        if (denied.has(needed)) {
          return res.status(403).send(`Permission denied: ${needed}`);
        }
        // 2) "allow" muss vorhanden sein
        if (!allowed.has(needed)) {
          return res.status(403).send(`Missing permission: ${needed}`);
        }
      }

      // Alles erlaubt
      next();
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      return res.status(500).send('Internal server error');
    }
  };
}

module.exports = {
  requirePermission
};
