import React, { useState } from "react";
import { useRolesPermissions, Role, Permission } from "../hooks/useRolesPermissions";

const RolesPage: React.FC = () => {
  const {
    roles,
    error,
    loading,
    createRole,
    updateRole,
    deleteRole,
    fetchRolePermissions,
    addPermissionToRole,
    removePermissionFromRole,
  } = useRolesPermissions();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermissionId, setNewPermissionId] = useState("");

  // 🔹 Rolle auswählen & Berechtigungen laden
  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role);
    const permissions = await fetchRolePermissions(role._id);
    setRolePermissions(permissions);
  };

  // 🔹 Neue Rolle erstellen
  const handleCreateRole = async () => {
    if (newRoleName.trim() === "") return;
    await createRole(newRoleName);
    setNewRoleName("");
  };

  // 🔹 Rolle umbenennen
  const handleUpdateRole = async () => {
    if (!selectedRole || newRoleName.trim() === "") return;
    await updateRole(selectedRole._id, newRoleName);
    setSelectedRole(null);
    setNewRoleName("");
  };

  // 🔹 Rolle löschen
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    await deleteRole(selectedRole._id);
    setSelectedRole(null);
    setRolePermissions([]);
  };

  // 🔹 Berechtigung zur Rolle hinzufügen
  const handleAddPermission = async () => {
    if (!selectedRole || newPermissionId.trim() === "") return;
    await addPermissionToRole(selectedRole._id, newPermissionId);
    const updatedPermissions = await fetchRolePermissions(selectedRole._id);
    setRolePermissions(updatedPermissions);
    setNewPermissionId("");
  };

  // 🔹 Berechtigung von der Rolle entfernen
  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    await removePermissionFromRole(selectedRole._id, permissionId);
    setRolePermissions((prev) => prev.filter((perm) => perm._id !== permissionId));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Rollenverwaltung</h1>

      {/* 🔹 Rollenliste */}
      <div className="flex gap-6">
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-2">Rollen</h2>
          {loading && <p>Lade Rollen...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <ul className="border rounded-md p-2 bg-gray-100">
            {roles.map((role) => (
              <li
                key={role._id}
                onClick={() => handleSelectRole(role)}
                className={`cursor-pointer p-2 rounded-md ${
                  selectedRole?._id === role._id ? "bg-blue-300" : "hover:bg-blue-200"
                }`}
              >
                {role.name}
              </li>
            ))}
          </ul>

          {/* 🔹 Neue Rolle hinzufügen */}
          <div className="mt-4">
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Neue Rolle eingeben"
              className="border p-2 rounded-md w-full"
            />
            <button
              onClick={handleCreateRole}
              className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md w-full"
            >
              Rolle erstellen
            </button>
          </div>
        </div>

        {/* 🔹 Berechtigungen der ausgewählten Rolle */}
        {selectedRole && (
          <div className="w-2/3">
            <h2 className="text-xl font-semibold mb-2">Berechtigungen für: {selectedRole.name}</h2>
            <ul className="border rounded-md p-2 bg-gray-100">
              {rolePermissions.length === 0 && <p>Keine Berechtigungen.</p>}
              {rolePermissions.map((perm) => (
                <li key={perm._id} className="p-2 flex justify-between">
                  {perm.name}
                  <button
                    onClick={() => handleRemovePermission(perm._id)}
                    className="bg-red-500 text-white px-2 py-1 rounded-md"
                  >
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>

            {/* 🔹 Berechtigung hinzufügen */}
            <div className="mt-4">
              <input
                type="text"
                value={newPermissionId}
                onChange={(e) => setNewPermissionId(e.target.value)}
                placeholder="Berechtigungs-ID eingeben"
                className="border p-2 rounded-md w-full"
              />
              <button
                onClick={handleAddPermission}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
              >
                Berechtigung hinzufügen
              </button>
            </div>

            {/* 🔹 Rolle bearbeiten & löschen */}
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleUpdateRole}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md w-full"
              >
                Rolle umbenennen
              </button>
              <button
                onClick={handleDeleteRole}
                className="bg-red-500 text-white px-4 py-2 rounded-md w-full"
              >
                Rolle löschen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesPage;
