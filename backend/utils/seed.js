const Role = require('../models/Roles');
const User = require('../models/User');
const Permission = require('../models/Permissions');
const RolePermissions = require('../models/Role_Permissions');
const UserRole = require('../models/User_Role');

async function initializeSystem() {
  // 1. Rollen anlegen, falls sie nicht existieren
  let ownerRole = await Role.findOne({ name: 'Superadmin' });
  if (!ownerRole) {
    ownerRole = new Role({ name: 'Superadmin', priority: 0 });
    await ownerRole.save();
    console.log('Superadmin Rolle erstellt');
  }

  let userRole = await Role.findOne({ name: 'User' });
  if (!userRole) {
    userRole = new Role({ name: 'User', priority: 2 });
    await userRole.save();
    console.log('User-Rolle erstellt');
  }


  const OwnerPermissions = ['manage_adminRoles', 'manage_adminPermissions', 'manage_adminMembership'];
  for (const permName of OwnerPermissions) {
    let perm = await Permission.findOne({ name: permName });
    if (!perm) {
      perm = new Permission({ name: permName, priority: 0 });
      await perm.save();
      console.log(`Permission ${permName} erstellt`);
    }


    const rpOwnerExists = await RolePermissions.findOne({ role: ownerRole._id, permission: perm._id });
    if (!rpOwnerExists) {
      await RolePermissions.create({
        role: ownerRole._id,
        permission: perm._id,
        effect: 'allow'
      });
    }
  }

  const AdminPermissions = ['view_userRoles', 'manage_userRoles', 'view_userMembership', 'manage_userMembership', 'view_userPermissions', 'manage_userPermissions', 'manage_allUsers'];
  for (const permName of AdminPermissions) {
    let perm = await Permission.findOne({ name: permName });
    if (!perm) {
      perm = new Permission({ name: permName, priority: 1 });
      await perm.save();
      console.log(`Permission ${permName} erstellt`);
    }


    const rpOwnerExists = await RolePermissions.findOne({ role: ownerRole._id, permission: perm._id });
    if (!rpOwnerExists) {
      await RolePermissions.create({
        role: ownerRole._id,
        permission: perm._id,
        effect: 'allow'
      });
    }
  }

  const UserPermissions = ['view_account', 'view_allUsers'];
  for (const permName of UserPermissions) {
    let perm = await Permission.findOne({ name: permName, priority: 2 });
    if (!perm) {
      perm = new Permission({ name: permName });
      await perm.save();
      console.log(`Permission ${permName} erstellt`);
    }

    // Optional: Owner-Rolle verknüpfen (allow)
    const rpOwnerExists = await RolePermissions.findOne({ role: ownerRole._id, permission: perm._id });
    if (!rpOwnerExists) {
      await RolePermissions.create({
        role: ownerRole._id,
        permission: perm._id,
        effect: 'allow'
      });
    }

    // Optional: User-Rolle verknüpfen (allow) – du kannst hier differenzieren,
    // ob eine bestimmte Permission nur für Owner, Admins oder User gedacht ist
    const rpUserExists = await RolePermissions.findOne({ role: userRole._id, permission: perm._id });
    if (!rpUserExists) {
      await RolePermissions.create({
        role: userRole._id,
        permission: perm._id,
        effect: 'allow'
      });
    }
  }

  // 3. Prüfen, ob es schon User gibt
  const userCount = await User.countDocuments({});
  if (userCount === 0) {
    console.log('Noch keine User vorhanden. Der erste registrierte User wird Admin.');
  } else {
    console.log(`Es gibt bereits ${userCount} User in der Datenbank.`);
  }
}

module.exports = { initializeSystem };
