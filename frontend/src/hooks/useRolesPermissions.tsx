import { useProtectedFetch } from "./useProtectedFetch"; // Passe ggf. den Pfad an
import { useCallback } from "react";

// Interfaces (optional, aber hilfreich für Typisierung)
export interface Role {
  _id: string;
  name: string;
  priority: number;
}

export interface Permission {
  _id: string;
  name: string;
}

export interface RolePermission {
  _id: string;
  role: string | Role; // `role` statt `roleId`, weil dein Schema `role` verwendet
  permission: string | Permission; // `permission` statt `permissionId`
  effect: "allow" | "deny"; // `effect` statt `action`
}


// Basis-URL deines Backends – idealerweise in einer Umgebungsvariablen speichern
const BASE_URL = "/api/protected";

// 1️⃣ Hook: Rolle erstellen
export const useCreateRole = () => {
  const protectedFetch = useProtectedFetch();

  const createRole = useCallback(async (name: string, priority: number): Promise<Role | null> => {
    const url = `${BASE_URL}/roles`;
    const responseText = await protectedFetch(url, "POST", { name, priority});
    if (!responseText || responseText === "Ressource geschützt") return null;
    try {
      const role: Role = JSON.parse(responseText);
      return role;
    } catch (error) {
      console.error("Fehler beim Parsen der Rolle:", error);
      return null;
    }
  }, [protectedFetch]);

  return { createRole };
};

// 2️⃣ Hook: Alle Rollen abrufen
export const useGetRoles = () => {
  const protectedFetch = useProtectedFetch();

  const getRoles = useCallback(async (): Promise<Role[] | null> => {
    const url = `${BASE_URL}/roles`;
    const responseText = await protectedFetch(url, "GET");
    if (!responseText || responseText === "Ressource geschützt") return null;
    try {
      const roles: Role[] = JSON.parse(responseText);
      return roles;
    } catch (error) {
      console.error("Fehler beim Parsen der Rollen:", error);
      return null;
    }
  }, [protectedFetch]);

  return { getRoles };
};

// 3️⃣ Hook: Eine Rolle bearbeiten
export const useUpdateRole = () => {
  const protectedFetch = useProtectedFetch();

  const updateRole = useCallback(async (roleId: string, roleData: { name: string, priority: number }): Promise<Role | null> => {
    const url = `${BASE_URL}/roles/${roleId}`;
    const responseText = await protectedFetch(url, "PUT", { roleData });
    if (!responseText || responseText === "Ressource geschützt") return null;
    try {
      const updatedRole: Role = JSON.parse(responseText);
      return updatedRole;
    } catch (error) {
      console.error("Fehler beim Parsen der aktualisierten Rolle:", error);
      return null;
    }
  }, [protectedFetch]);

  return { updateRole };
};

// 4️⃣ Hook: Eine Rolle löschen
export const useDeleteRole = () => {
  const protectedFetch = useProtectedFetch();

  const deleteRole = useCallback(async (roleId: string): Promise<boolean> => {
    const url = `${BASE_URL}/roles/${roleId}`;
    const responseText = await protectedFetch(url, "DELETE");
    if (!responseText || responseText === "Ressource geschützt") return false;
    try {
      const responseObj = JSON.parse(responseText);
      return responseObj.message === "Rolle erfolgreich gelöscht";
    } catch (error) {
      console.error("Fehler beim Parsen der Lösch-Antwort:", error);
      return false;
    }
  }, [protectedFetch]);

  return { deleteRole };
};

// 9️⃣ Hook: Berechtigungen einer Rolle abrufen + welche bearbeitet werden dürfen
export const useGetRolePermissions = () => {
  const protectedFetch = useProtectedFetch();

  const getRolePermissions = useCallback(async (roleId: string): Promise<{ rolePermissions: RolePermission[]; editable: string[] } | null> => {
    const url = `${BASE_URL}/roles/${roleId}/permissions`;
    const responseText = await protectedFetch(url, "GET");

    if (!responseText || responseText === "Ressource geschützt") return null;

    try {
      const responseData = JSON.parse(responseText);

      // Prüfen, ob das Backend die erwarteten Daten liefert
      if (!responseData.rolePermissions || !Array.isArray(responseData.rolePermissions)) {
        console.error("Fehler: Ungültige API-Antwort (fehlende rolePermissions)");
        return null;
      }
      if (!responseData.editablePermissions || !Array.isArray(responseData.editablePermissions)) {
        console.error("Fehler: Ungültige API-Antwort (fehlende editable-Liste)");
        return null;
      }

      return {
        rolePermissions: responseData.rolePermissions, // Berechtigungen dieser Rolle
        editable: responseData.editablePermissions, // Liste der bearbeitbaren Berechtigungen für diese Rolle
      };
    } catch (error) {
      console.error("Fehler beim Parsen der Rollen-Berechtigungen:", error);
      return null;
    }
  }, [protectedFetch]);

  return { getRolePermissions };
};



// 6️⃣ Hook: Berechtigung einer Rolle hinzufügen/aktualisieren
export const useAddRolePermission = () => {
  const protectedFetch = useProtectedFetch();

  const addRolePermission = useCallback(async (
    roleId: string,
    permissionId: string,
    action: "allow" | "deny"
  ): Promise<RolePermission | null> => {
    const url = `${BASE_URL}/roles/${roleId}/permissions`;
    const responseText = await protectedFetch(url, "POST", { permissionId, action });
    if (!responseText || responseText === "Ressource geschützt") return null;
    try {
      const rolePermission: RolePermission = JSON.parse(responseText);
      return rolePermission;
    } catch (error) {
      console.error("Fehler beim Parsen der Rollen-Berechtigung:", error);
      return null;
    }
  }, [protectedFetch]);

  return { addRolePermission };
};

// 7️⃣ Hook: Berechtigung von einer Rolle entfernen
export const useDeleteRolePermission = () => {
  const protectedFetch = useProtectedFetch();

  const deleteRolePermission = useCallback(async (
    roleId: string,
    permissionId: string
  ): Promise<boolean> => {
    const url = `${BASE_URL}/roles/${roleId}/permissions`;
    const responseText = await protectedFetch(url, "DELETE", { permissionId });
    if (!responseText || responseText === "Ressource geschützt") return false;
    try {
      const responseObj = JSON.parse(responseText);
      return responseObj.message === "Berechtigung erfolgreich entfernt";
    } catch (error) {
      console.error("Fehler beim Parsen der Antwort zum Entfernen der Berechtigung:", error);
      return false;
    }
  }, [protectedFetch]);

  return { deleteRolePermission };
};

// 8️⃣ Hook: Alle Berechtigungen abrufen
export const useGetPermissions = () => {
  const protectedFetch = useProtectedFetch();

  const getPermissions = useCallback(async (): Promise<Permission[] | null> => {
    const url = `${BASE_URL}/permissions`;
    const responseText = await protectedFetch(url, "GET");
    if (!responseText || responseText === "Ressource geschützt") return null;
    try {
      const permissions: Permission[] = JSON.parse(responseText);
      return permissions;
    } catch (error) {
      console.error("Fehler beim Parsen der Berechtigungen:", error);
      return null;
    }
  }, [protectedFetch]);
  

  return { getPermissions };

};

// 9️⃣ Hook: Benutzer-Priorität abrufen
export const useGetUserPriority = () => {
  const protectedFetch = useProtectedFetch();

  const getUserPriority = useCallback(async (): Promise<number> => {
    const url = `${BASE_URL}/users/me/priority`;
    const responseText = await protectedFetch(url, "GET");

    if (!responseText || responseText === "Ressource geschützt") return 3; // Standard: niedrigste Priorität

    try {
      const data = JSON.parse(responseText);
      return data.priority ?? 3; // Falls keine Priorität vorhanden ist, Standardwert 3 (Service)
    } catch (error) {
      console.error("Fehler beim Abrufen der Benutzerpriorität:", error);
      return 3;
    }
  }, [protectedFetch]);

  return { getUserPriority };
};
