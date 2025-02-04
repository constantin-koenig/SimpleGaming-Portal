// PermissionsManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Permission,
  Role,
  useGetPermissions,
  useGetRolePermissions,
  useAddRolePermission,
  useDeleteRolePermission,
} from '../hooks/useRolesPermissions';

interface PermissionsManagerProps {
  selectedRole: Role;
}

interface PermissionWithStatus {
  permission: Permission;
  status: "allow" | "neutral" | "deny";
}

interface PermissionToggleProps {
  currentState: "allow" | "neutral" | "deny";
  onChange: (newState: "allow" | "neutral" | "deny") => void;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({ currentState, onChange }) => {
  // Bestimmt den Button-Stil basierend auf dem aktuellen Status
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

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ selectedRole }) => {
  const { getPermissions } = useGetPermissions();
  const { getRolePermissions } = useGetRolePermissions();
  const { addRolePermission } = useAddRolePermission();
  const { deleteRolePermission } = useDeleteRolePermission();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsWithStatus, setPermissionsWithStatus] = useState<PermissionWithStatus[]>([]);

  // Alle Berechtigungen beim Mount laden
  useEffect(() => {
    getPermissions().then((perms) => {
      if (perms) {
        setPermissions(perms);
      }
    });
  }, []);

  // Rolle-spezifische Berechtigungen laden, wenn sich die ausgewählte Rolle oder die Gesamtliste ändert
  useEffect(() => {
    const fetchRolePermissions = async () => {
      const rolePerms = await getRolePermissions(selectedRole._id);
      if (rolePerms) {
        const updatedPermissions = permissions.map((perm) => {
          const matchingPermission = rolePerms.find((rp) =>
            typeof rp.permission === 'string'
              ? rp.permission === perm._id
              : rp.permission._id === perm._id
          );
          return {
            permission: perm,
            status: matchingPermission ? (matchingPermission.effect as "allow" | "neutral" | "deny") : "neutral",
          };
        });
        setPermissionsWithStatus(updatedPermissions);
      }
    };
    fetchRolePermissions();
  }, [selectedRole, permissions]);

  const handleToggleChange = async (
    permission: Permission,
    newState: "allow" | "neutral" | "deny"
  ) => {
    const rolePerms = await getRolePermissions(selectedRole._id);
    if (!rolePerms) return;

    const currentRP = rolePerms.find((rp) =>
      typeof rp.permission === 'string'
        ? rp.permission === permission._id
        : rp.permission._id === permission._id
    );
    const currentState = currentRP ? currentRP.effect : "neutral";
    if (newState === currentState) return; // Keine Änderung

    if (newState === "neutral") {
      if (currentRP) {
        const success = await deleteRolePermission(selectedRole._id, permission._id);
        if (success) {
          refreshPermissions();
        }
      }
    } else {
      const updatedRP = await addRolePermission(selectedRole._id, permission._id, newState);
      if (updatedRP) {
        refreshPermissions();
      }
    }
  };

  const refreshPermissions = async () => {
    const rolePerms = await getRolePermissions(selectedRole._id);
    if (rolePerms) {
      const updatedPermissions = permissions.map((perm) => {
        const matchingPermission = rolePerms.find((rp) =>
          typeof rp.permission === 'string'
            ? rp.permission === perm._id
            : rp.permission._id === perm._id
        );
        return {
          permission: perm,
          status: matchingPermission ? (matchingPermission.effect as "allow" | "neutral" | "deny") : "neutral",
        };
      });
      setPermissionsWithStatus(updatedPermissions);
    }
  };

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Permission</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {permissionsWithStatus.map(({ permission, status }) => (
            <tr key={permission._id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{permission.name}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <PermissionToggle
                  currentState={status}
                  onChange={(newState) => handleToggleChange(permission, newState)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PermissionsManager;
