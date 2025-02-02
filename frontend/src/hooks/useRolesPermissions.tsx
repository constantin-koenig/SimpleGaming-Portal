import { useState, useEffect } from "react";
import { useProtectedFetch } from "./useProtectedFetch";

export type Role = {
  _id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Permission = {
  _id: string;
  name: string;
};

export type RolePermission = {
  roleId: string;
  permissionId: string;
};

export const useRolesPermissions = () => {
  const fetchProtectedResource = useProtectedFetch();

  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔹 Rollen abrufen
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);

    const data = await fetchProtectedResource("/api/protected/roles", "GET");

    if (data === "Ressource geschützt") {
      setError("Zugriff verweigert. Bitte überprüfe deine Berechtigungen.");
      setLoading(false);
      return;
    }

    if (data) {
      try {
        setRoles(JSON.parse(data));
      } catch (error) {
        console.error("Fehler beim Parsen der Rollen:", error);
        setError("Fehler beim Laden der Rollen.");
      }
    }

    setLoading(false);
  };

  // 🔹 Neue Rolle erstellen
  const createRole = async (name: string) => {
    setLoading(true);
    const data = await fetchProtectedResource("/api/protected/roles", "POST", { name });

    if (data && data !== "Ressource geschützt") {
      await fetchRoles();
    }

    setLoading(false);
  };

  // 🔹 Rolle bearbeiten
  const updateRole = async (roleId: string, name: string) => {
    setLoading(true);
    const data = await fetchProtectedResource(`/api/protected/roles/${roleId}`, "PUT", { name });

    if (data && data !== "Ressource geschützt") {
      await fetchRoles();
    }

    setLoading(false);
  };

  // 🔹 Rolle löschen
  const deleteRole = async (roleId: string) => {
    setLoading(true);
    const data = await fetchProtectedResource(`/api/protected/roles/${roleId}`, "DELETE");

    if (data && data !== "Ressource geschützt") {
      await fetchRoles();
    }

    setLoading(false);
  };

  // 🔹 Berechtigungen einer Rolle abrufen
  const fetchRolePermissions = async (roleId: string): Promise<Permission[]> => {
    setLoading(true);
    const data = await fetchProtectedResource(`/api/protected/roles/${roleId}/permissions`, "GET");

    if (data === "Ressource geschützt") {
      setError("Zugriff verweigert. Bitte überprüfe deine Berechtigungen.");
      setLoading(false);
      return [];
    }

    setLoading(false);
    return data ? JSON.parse(data) : [];
  };

  // 🔹 Berechtigung zu einer Rolle hinzufügen
  const addPermissionToRole = async (roleId: string, permissionId: string) => {
    setLoading(true);
    const data = await fetchProtectedResource(`/api/protected/roles/${roleId}/permissions`, "POST", { permissionId });

    if (data && data !== "Ressource geschützt") {
      await fetchRoles();
    }

    setLoading(false);
  };

  // 🔹 Berechtigung von einer Rolle entfernen
  const removePermissionFromRole = async (roleId: string, permissionId: string) => {
    setLoading(true);
    const data = await fetchProtectedResource(`/api/protected/roles/${roleId}/permissions/${permissionId}`, "DELETE");

    if (data && data !== "Ressource geschützt") {
      await fetchRoles();
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    error,
    loading,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchRolePermissions,
    addPermissionToRole,
    removePermissionFromRole,
  };
};
