// 📌 RolesManagement.tsx (Now selecting role when editing)
import React, { useState, useEffect } from 'react';
import {
  Role,
  Permission,
  RolePermission,
  useGetRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useGetPermissions,
  useGetRolePermissions,
  useAddRolePermission,
  useDeleteRolePermission,
} from '../hooks/useRolesPermissions';

// 🔹 Toggle component
interface PermissionToggleProps {
  currentState: "allow" | "neutral" | "deny";
  onChange: (newState: "allow" | "neutral" | "deny") => void;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({ currentState, onChange }) => {
  const getButtonStyle = (buttonState: "allow" | "neutral" | "deny") => {
    let background = 'lightgray';
    let color = 'black';
    if (currentState === buttonState) {
      if (buttonState === 'allow') {
        background = 'green';
        color = 'white';
      } else if (buttonState === 'deny') {
        background = 'red';
        color = 'white';
      }
    }
    return { background, color, border: 'none', padding: '4px 8px', cursor: 'pointer' };
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button style={getButtonStyle('allow')} onClick={() => onChange('allow')}>✓</button>
      <button style={getButtonStyle('neutral')} onClick={() => onChange('neutral')}>–</button>
      <button style={getButtonStyle('deny')} onClick={() => onChange('deny')}>✗</button>
    </div>
  );
};

// 🔹 Main RolesManagement Component
const RolesManagement: React.FC = () => {
  // Hooks to fetch data
  const { getRoles } = useGetRoles();
  const { createRole } = useCreateRole();
  const { updateRole } = useUpdateRole();
  const { deleteRole } = useDeleteRole();
  const { getPermissions } = useGetPermissions();
  const { getRolePermissions } = useGetRolePermissions();
  const { addRolePermission } = useAddRolePermission();
  const { deleteRolePermission } = useDeleteRolePermission();

  // Local state
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsWithStatus, setPermissionsWithStatus] = useState<
    { permission: Permission; status: "allow" | "neutral" | "deny" }[]
  >([]);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // 📌 Fetch all roles once on mount
  useEffect(() => {
    getRoles().then((rolesData) => {
      if (rolesData) setRoles(rolesData);
    });
  }, []);

  // 📌 Fetch all permissions once on mount
  useEffect(() => {
    getPermissions().then((perms) => {
      if (perms) setPermissions(perms);
    });
  }, []);

  // 📌 Select a role and load its permissions
  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role);
    setEditingRoleId(null); // Close edit mode
    const rolePerms = await getRolePermissions(role._id);

    if (rolePerms) {
      const updatedPermissions = permissions.map((perm) => {
        const matchingPermission = rolePerms.find((rp) => 
          typeof rp.permission === 'string' ? rp.permission === perm._id : rp.permission._id === perm._id
        );

        return {
          permission: perm,
          status: matchingPermission ? (matchingPermission.effect as "allow" | "neutral" | "deny") : "neutral",
        };
      });

      setPermissionsWithStatus(updatedPermissions);
    }
  };

  // 📌 Create a new role
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    const newRole = await createRole(newRoleName);
    if (newRole) {
      setRoles([...roles, newRole]);
      setNewRoleName('');
    }
  };

  // 📌 Update role name
  const handleUpdateRole = async (roleId: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedRole = await updateRole(roleId, newName);
    if (updatedRole) {
      setRoles(roles.map((r) => (r._id === roleId ? updatedRole : r)));
      setEditingRoleId(null);
    }
  };

  // 📌 Delete a role
  const handleDeleteRole = async (roleId: string) => {
    const success = await deleteRole(roleId);
    if (success) {
      setRoles(roles.filter((r) => r._id !== roleId));
      if (selectedRole && selectedRole._id === roleId) setSelectedRole(null);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* 🔹 Roles List */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <h2>Roles</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {roles.map((role) => (
            <li key={role._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              {editingRoleId === role._id ? (
                <input 
                  type="text" 
                  value={role.name} 
                  onChange={(e) => handleUpdateRole(role._id, e.target.value)} 
                  onBlur={() => setEditingRoleId(null)} 
                  autoFocus
                />
              ) : (
                <span>{role.name}</span>
              )}
              <div>
                <button onClick={() => { setEditingRoleId(role._id); handleSelectRole(role); }} style={{ marginRight: '5px' }}>✏️</button>
                <button onClick={() => handleDeleteRole(role._id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
        {/* Add new role input */}
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="New role name"
          />
          <button onClick={handleCreateRole}>➕ Create</button>
        </div>
      </div>

      {/* 🔹 Permissions List */}
      <div style={{ width: '70%', padding: '1rem' }}>
        {selectedRole ? (
          <div>
            <h2>Edit Role: {selectedRole.name}</h2>
            <table>
              <tbody>
                {permissionsWithStatus.map(({ permission, status }) => (
                  <tr key={permission._id}>
                    <td>{permission.name}</td>
                    <td>
                      <PermissionToggle
                        currentState={status}
                        onChange={(newState) => console.log(`Updating ${permission.name} to ${newState}`)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Select a role to edit its permissions</p>
        )}
      </div>
    </div>
  );
};

export default RolesManagement;
