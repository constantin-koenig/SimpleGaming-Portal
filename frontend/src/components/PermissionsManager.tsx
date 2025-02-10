import React, { useState, useEffect } from 'react';
import {
  useGetPermissions,
  useGetRolePermissions,
  useAddRolePermission,
  useDeleteRolePermission,
} from '../hooks/useRolesPermissions';

interface PermissionsManagerProps {
  selectedRole: { _id: string; name: string };
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ selectedRole }) => {
  const { getPermissions } = useGetPermissions();
  const { getRolePermissions } = useGetRolePermissions();
  const { addRolePermission } = useAddRolePermission();
  const { deleteRolePermission } = useDeleteRolePermission();

  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [editablePermissions, setEditablePermissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      const allPermissionsData = await getPermissions();
      if (allPermissionsData) {
        setPermissions(allPermissionsData); // Speichert alle möglichen Berechtigungen
      }

      const rolePermissionsData = await getRolePermissions(selectedRole._id);
      if (rolePermissionsData) {
        setRolePermissions(rolePermissionsData.rolePermissions);
        setEditablePermissions(rolePermissionsData.editable);
      }
    };

    fetchPermissions();
  }, [selectedRole]);

  // Prüft, ob eine Berechtigung aktiv ist
  const getPermissionStatus = (permId: string) => {
    const permission = rolePermissions.find((rp) => rp.permission._id === permId);
    return permission ? permission.effect : "neutral";
  };

  // Ändert die Berechtigungsstufe
  const getPermissionEditable = (permId: string) => {
    const permission = editablePermissions.find((rp) => rp._id === permId);
    return permission ? true : false;
  };

  const handleToggleChange = async (permId: string, newState: "allow" | "neutral" | "deny") => {
   
    const currentStatus = getPermissionStatus(permId);

    if (newState === currentStatus) return;

    if (newState === "neutral") {
      await deleteRolePermission(selectedRole._id, permId);
    } else {
      await addRolePermission(selectedRole._id, permId, newState);
    }

    const updatedRolePermissions = await getRolePermissions(selectedRole._id);
    if (updatedRolePermissions) {
      setRolePermissions(updatedRolePermissions.rolePermissions);
    }
  };

  return (
    <div>
      <h3>Berechtigungen für: {selectedRole.name}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Berechtigung</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '8px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => {
            const isEditable = getPermissionEditable(permission._id);
            const currentState = getPermissionStatus(permission._id);

            return (
              <tr key={permission._id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{permission.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {["allow", "neutral", "deny"].map((state) => (
                      <button
                        key={state}
                        onClick={() => handleToggleChange(permission._id, state as "allow" | "neutral" | "deny")}
                        disabled={!isEditable}
                        style={{
                          background: currentState === state ? (state === "allow" ? "green" : state === "deny" ? "red" : "gray") : "lightgray",
                          color: currentState === state ? "white" : "black",
                          border: "none",
                          padding: "4px 8px",
                          cursor: isEditable ? "pointer" : "not-allowed",
                          opacity: isEditable ? 1 : 0.5, // Grau & inaktiv, wenn nicht bearbeitbar
                        }}
                      >
                        {state === "allow" ? "✓" : state === "neutral" ? "–" : "✗"}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PermissionsManager;
