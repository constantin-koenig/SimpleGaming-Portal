// RoleManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Role,
  useGetRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '../hooks/useRolesPermissions';
import PermissionsManager from './PermissionsManager';
import RoleMembers from './RoleMembers';

const RoleManager: React.FC = () => {
  const { getRoles } = useGetRoles();
  const { createRole } = useCreateRole();
  const { updateRole } = useUpdateRole();
  const { deleteRole } = useDeleteRole();

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'Anzeige' | 'Berechtigungen' | 'Mitglieder'>('Anzeige');
  const [roleName, setRoleName] = useState<string>('');
  const [rolePriority, setRolePriority] = useState<number>(2); // Standard: User
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRolePriority, setNewRolePriority] = useState<number>(2);
  const [showNewRoleForm, setShowNewRoleForm] = useState<boolean>(false);

  useEffect(() => {
    fetchRoles();
  }, [activeTab, selectedRole]);

  const fetchRoles = async () => {
    const rolesData = await getRoles();
    if (rolesData) {
      setRoles(rolesData);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRolePriority(role.priority || 2);
    setActiveTab((prevTab) => prevTab); // Behalte den aktuellen Tab bei
  };

  const handleRoleUpdate = async () => {
    if (selectedRole && roleName.trim() !== '') {
      const updated = await updateRole(selectedRole._id, { name: roleName, priority: rolePriority });
      if (updated) {
        fetchRoles();
        setSelectedRole({ ...selectedRole, name: roleName, priority: rolePriority });
      }
    }
  };

  const handleDeleteRole = async () => {
    if (selectedRole && window.confirm(`Möchtest du die Rolle "${selectedRole.name}" wirklich löschen?`)) {
      const deleted = await deleteRole(selectedRole._id);
      if (deleted) {
        fetchRoles();
        setSelectedRole(null);
        setActiveTab('Anzeige'); // Zurücksetzen
      }
    }
  };

  const handleCreateRole = async () => {
    if (newRoleName.trim() !== '') {
      const newRole = await createRole(  newRoleName,  newRolePriority );
      if (newRole) {
        fetchRoles();
        setNewRoleName('');
        setNewRolePriority(2);
        setShowNewRoleForm(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Rollenliste */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <h2>Rollen</h2>

        {/* Neue Rolle hinzufügen */}
        <button
          onClick={() => setShowNewRoleForm(true)}
          style={{
            marginBottom: '10px',
            padding: '5px 10px',
            background: 'green',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ➕ Neue Rolle hinzufügen
        </button>

        {showNewRoleForm && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Neuer Rollenname"
              style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <select
              value={newRolePriority}
              onChange={(e) => setNewRolePriority(Number(e.target.value))}
              style={{ marginLeft: '10px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value={1}>Admin</option>
              <option value={2}>User</option>
              <option value={3}>Service</option>
            </select>
            <button
              onClick={handleCreateRole}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                background: 'blue',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Speichern
            </button>
            <button
              onClick={() => setShowNewRoleForm(false)}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                background: 'red',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
          </div>
        )}

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
                onClick={() => handleSelectRole(role)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                ✏️
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rollen-Details */}
      <div style={{ width: '70%', padding: '1rem' }}>
        {selectedRole ? (
          <div>
            <h2>Rolle bearbeiten: {selectedRole.name}</h2>
            {/* Tab-Navigation */}
            <div style={{ marginBottom: '1rem' }}>
              <button onClick={() => setActiveTab('Anzeige')}>Anzeige</button>
              <button onClick={() => setActiveTab('Berechtigungen')}>Berechtigungen</button>
              <button onClick={() => setActiveTab('Mitglieder')}>Mitglieder</button>
            </div>

            {/* Tab-Inhalt */}
            {activeTab === 'Anzeige' && (
              <div>
                <label>Name:</label>
                <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
                
                <label>Priorität:</label>
                <select value={rolePriority} onChange={(e) => setRolePriority(Number(e.target.value))}>
                  <option value={1}>Admin</option>
                  <option value={2}>User</option>
                  <option value={3}>Service</option>
                </select>

                <button onClick={handleRoleUpdate}>Speichern</button>
                <button onClick={handleDeleteRole}>Rolle löschen</button>
              </div>
            )}
            {activeTab === 'Berechtigungen' && <PermissionsManager selectedRole={selectedRole} />}
            {activeTab === 'Mitglieder' && <RoleMembers selectedRole={selectedRole} />}
          </div>
        ) : (
          <p>Bitte wählen Sie eine Rolle aus, um deren Details anzuzeigen</p>
        )}
      </div>
    </div>
  );
};

export default RoleManager;
