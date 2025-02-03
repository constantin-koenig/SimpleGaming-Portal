// Rollenverwaltung mit korrektem Schema
import React, { useState, useEffect } from 'react';
import {
  Role,
  Permission,
  RolePermission,
  useGetRoles,
  useGetPermissions,
  useGetRolePermissions,
  useAddRolePermission,
  useDeleteRolePermission,
} from '../hooks/useRolesPermissions';

// Toggle für Berechtigungen
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
    return {
      background,
      color,
      border: 'none',
      padding: '4px 8px',
      cursor: 'pointer',
    };
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button style={getButtonStyle('allow')} onClick={() => onChange('allow')}>
        ✓
      </button>
      <button style={getButtonStyle('neutral')} onClick={() => onChange('neutral')}>
        –
      </button>
      <button style={getButtonStyle('deny')} onClick={() => onChange('deny')}>
        ✗
      </button>
    </div>
  );
};

const RolesManagement: React.FC = () => {
  // Hooks zum Abrufen der Daten
  const { getRoles } = useGetRoles();
  const { getPermissions } = useGetPermissions();
  const { getRolePermissions } = useGetRolePermissions();
  const { addRolePermission } = useAddRolePermission();
  const { deleteRolePermission } = useDeleteRolePermission();

  // Lokaler State
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [permissionsWithStatus, setPermissionsWithStatus] = useState<
    { permission: Permission; status: "allow" | "neutral" | "deny" }[]
  >([]);

  // Lade alle Rollen (nur einmal beim Mount)
  useEffect(() => {
    getRoles().then((rolesData) => {
      if (rolesData) setRoles(rolesData);
    });
  }, []);

  // Lade alle Berechtigungen (nur einmal beim Mount)
  useEffect(() => {
    getPermissions().then((perms) => {
      if (perms) setPermissions(perms);
    });
  }, []);

  // Wenn eine Rolle ausgewählt wurde, lade ihre spezifischen Berechtigungen
  useEffect(() => {
    if (!selectedRole) return;
    
    getRolePermissions(selectedRole._id).then((rolePerms) => {
      console.log("test");
      if (rolePerms) {
        setRolePermissions(rolePerms);

        // Abgleich: Für jede Berechtigung prüfen, ob sie in den Rollen-Berechtigungen ist
        const updatedPermissions = permissions.map((perm) => {
          const matchingPermission = rolePerms.find((rp) => {
            return typeof rp.permission === 'string'
              ? rp.permission === perm._id
              : rp.permission._id === perm._id;
          });

          return {
            permission: perm,
            status: matchingPermission ? (matchingPermission.effect as "allow" | "neutral" | "deny") : "neutral",
          };
        });

        setPermissionsWithStatus(updatedPermissions);
      }
    });
  }, [selectedRole, permissions]);

  // Handler für den Toggle-Wechsel
  const handleToggleChange = async (
    permission: Permission,
    newState: "allow" | "neutral" | "deny"
  ) => {
    // Ermittle den aktuellen Zustand der Berechtigung
    const currentRP = rolePermissions.find((rp) => {
      return typeof rp.permission === 'string'
        ? rp.permission === permission._id
        : rp.permission._id === permission._id;
    });

    const currentState = currentRP ? currentRP.effect : "neutral";

    if (newState === currentState) return; // Keine Änderung

    if (newState === "neutral") {
      // Falls "neutral" gewählt wird: existierende Berechtigung löschen
      if (currentRP && selectedRole) {
        const success = await deleteRolePermission(selectedRole._id, permission._id);
        if (success) {
          setRolePermissions((prev) => prev.filter((rp) => rp.permission !== permission._id));
          setPermissionsWithStatus((prev) =>
            prev.map((p) =>
              p.permission._id === permission._id ? { ...p, status: "neutral" } : p
            )
          );
        }
      }
    } else {
      // Falls "allow" oder "deny" gewählt wird: Berechtigung hinzufügen oder aktualisieren
      if (selectedRole) {
        const updatedRP = await addRolePermission(selectedRole._id, permission._id, newState);
        if (updatedRP) {
          setRolePermissions((prev) => [...prev, updatedRP]);
          setPermissionsWithStatus((prev) =>
            prev.map((p) =>
              p.permission._id === permission._id ? { ...p, status: newState } : p
            )
          );
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Linke Spalte: Übersicht aller Rollen */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <h2>Rollen</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {roles.map((role) => (
            <li
              key={role._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span>{role.name}</span>
              <button
                onClick={() => setSelectedRole(role)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                ✏️
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rechte Spalte: Bearbeitungsbereich für die ausgewählte Rolle */}
      <div style={{ width: '70%', padding: '1rem' }}>
        {selectedRole ? (
          <div>
            <h2>Rolle bearbeiten: {selectedRole.name}</h2>
            <table>
              <tbody>
                {permissionsWithStatus.map(({ permission, status }) => (
                  <tr key={permission._id}>
                    <td>{permission.name}</td>
                    <td>
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
        ) : (
          <p>Wähle eine Rolle zum Bearbeiten aus</p>
        )}
      </div>
    </div>
  );
};

export default RolesManagement;
