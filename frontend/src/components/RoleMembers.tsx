import React, { useState, useEffect } from 'react';
import {
  useGetRoleMembers,
  useAddRoleMember,
  useRemoveRoleMember,
  useGetAllUsers,
} from '../hooks/useUsers';

interface RoleMembersProps {
  selectedRole: { _id: string; name: string };
}

const RoleMembers: React.FC<RoleMembersProps> = ({ selectedRole }) => {
  const { getRoleMembers } = useGetRoleMembers();
  const { addRoleMember } = useAddRoleMember();
  const { removeRoleMember } = useRemoveRoleMember();
  const { getAllUsers } = useGetAllUsers();

  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>(''); 
  const [addMemberSearchTerm, setAddMemberSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMembers = async () => {
      const membersData = await getRoleMembers(selectedRole._id);
      if (membersData === null) {
        setError("Du bist nicht berechtigt, Rollenmitglieder zu verwalten.");
      } else {
        setMembers(membersData);
        setFilteredMembers(membersData);
        setError(null);
      }
    };

    fetchMembers();
    resetAddMembers(); // Auswahl beim Rollenwechsel zurücksetzen
  }, [selectedRole]);

  // 🔄 Aktualisiert die Benutzerliste für „Mitglieder hinzufügen“ beim Rollenwechsel
  const resetAddMembers = async () => {
    setShowAddMembers(false);
    setSelectedUsers(new Set());
    setAddMemberSearchTerm('');
  };

  // 🔍 Lokale Suchfunktion für Mitgliederliste
  const handleMemberSearch = (term: string) => {
    setMemberSearchTerm(term);
    if (!term) {
      setFilteredMembers(members);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = members.filter((user) =>
      user.globalname?.toLowerCase().includes(lowerTerm)
    );

    setFilteredMembers(filtered);
  };

  // ➕ Öffne Mitglieder hinzufügen Modal & hole alle Benutzer
  const handleOpenAddMembers = async () => {
    setShowAddMembers(true);
    const users = await getAllUsers();
    setAllUsers(users);

    // 🔎 Filtere Benutzer, die nicht bereits Mitglieder sind
    const memberIds = new Set(members.map((user) => user._id));
    const nonMembers = users.filter((user: { _id: string }) => user && user._id && !memberIds.has(user._id));
    setAvailableUsers(nonMembers);
  };

  // 🔍 Lokale Suchfunktion für „Mitglieder hinzufügen“
  const handleAddMemberSearch = (term: string) => {
    setAddMemberSearchTerm(term);
    if (!term) {
      setAvailableUsers(allUsers.filter((user) => !members.some((m) => m._id === user._id)));
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = allUsers.filter(
      (user) =>
        user.globalname &&
        user.globalname.toLowerCase().includes(lowerTerm) &&
        !members.some((m) => m._id === user._id)
    );

    setAvailableUsers(filtered);
  };

  // ✅ Checkbox-Handling für Benutzer-Auswahl
  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // ➕ Mehrere Benutzer hinzufügen
  const handleAddSelectedUsers = async () => {
    const promises = Array.from(selectedUsers).map((userId) =>
      addRoleMember(selectedRole._id, userId)
    );
    await Promise.all(promises);

    // Mitgliederliste aktualisieren
    const updatedMembers = await getRoleMembers(selectedRole._id);
    setMembers(updatedMembers || []);
    setFilteredMembers(updatedMembers || []);

    // Verfügbare Benutzer erneut filtern
    const memberIds = new Set(updatedMembers.map((user: { _id: string }) => user._id));
    setAvailableUsers(allUsers.filter((user) => !memberIds.has(user._id)));

    resetAddMembers();
  };

  // ❌ Mitglied entfernen
  const handleRemoveMember = async (userId: string) => {
    if (await removeRoleMember(selectedRole._id, userId)) {
      const updatedMembers = members.filter((user) => user._id !== userId);
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
    }
  };

  return (
    <div>
      <h3>Mitglieder der Rolle: {selectedRole.name}</h3>

      {/* 🔍 Suchfeld für bestehende Mitglieder */}
      <input
        type="text"
        placeholder="Mitglieder durchsuchen..."
        value={memberSearchTerm}
        onChange={(e) => handleMemberSearch(e.target.value)}
        style={{
          padding: '5px',
          marginBottom: '10px',
          width: '100%',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />

      {/* 🔴 Fehleranzeige */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* ➕ Mitglieder hinzufügen Button */}
      {!error && (
        <button
          onClick={handleOpenAddMembers}
          style={{
            marginBottom: '10px',
            padding: '5px 10px',
            background: 'blue',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ➕ Mitglieder hinzufügen
        </button>
      )}

      {/* 🏷️ Mitgliederliste */}
      {!error && filteredMembers.length > 0 ? (
        <ul style={{ padding: 0, listStyleType: 'none' }}>
          {filteredMembers.map((user) => (
            <li key={user._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <img
                src={user.avatarURL}
                alt="Profil"
                style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
              />
              {user.globalname}
              <button
                onClick={() => handleRemoveMember(user._id)}
                style={{ marginLeft: '10px', background: 'red', color: 'white', border: 'none', padding: '5px' }}
              >
                ❌ Entfernen
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p>Keine Mitglieder gefunden.</p>
      )}

      {/* 📌 Mitglieder hinzufügen (Modal) */}
      {showAddMembers && (
        <div>
          <h4>Mitglieder hinzufügen</h4>
          <input
            type="text"
            placeholder="Benutzer suchen..."
            value={addMemberSearchTerm}
            onChange={(e) => handleAddMemberSearch(e.target.value)}
            style={{
              padding: '5px',
              marginBottom: '10px',
              width: '100%',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
          <div>
            {availableUsers.map((user) => (
              <div key={user._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <input type="checkbox" checked={selectedUsers.has(user._id)} onChange={() => handleUserSelection(user._id)} />
                <img src={user.avatarURL} alt="Profil" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }} />
                {user.globalname}
              </div>
            ))}
          </div>

          <button onClick={handleAddSelectedUsers}>➕ Ausgewählte hinzufügen</button>
          <button onClick={resetAddMembers}>❌ Abbrechen</button>
        </div>
      )}
    </div>
  );
};

export default RoleMembers;
