import { useCallback } from "react";
import { useProtectedFetch } from "./useProtectedFetch";

const BASE_URL = "/api/protected";

// 1️⃣ Mitglieder einer Rolle abrufen
export const useGetRoleMembers = () => {
  const protectedFetch = useProtectedFetch();

  const getRoleMembers = useCallback(async (roleId: string) => {
    const url = `${BASE_URL}/roles/${roleId}/members`;
    const responseText = await protectedFetch(url, "GET");

    if (!responseText || responseText === "Ressource geschützt") return null;

    try {
      const members = JSON.parse(responseText);

      // Füge das Profilbild für jedes Mitglied hinzu
      const enrichedMembers = members.map((member: any) => {
        if (!member.avatar || !member.discordId) {
          return { ...member, avatarURL: null }; // Falls kein Avatar vorhanden ist
        }

        const baseURL = "https://cdn.discordapp.com/avatars/";
        const avatarHash = member.avatar;
        const userId = member.discordId;
        const avatarExtension = avatarHash.startsWith("a") ? ".gif" : ".png";
        const avatarURL = `${baseURL}${userId}/${avatarHash}${avatarExtension}`;

        return { ...member, avatarURL };
      });

      return enrichedMembers;
    } catch (error) {
      console.error("Fehler beim Abrufen der Rollen-Mitglieder:", error);
      return null;
    }
  }, [protectedFetch]);

  return { getRoleMembers };
};

// 2️⃣ Benutzer einer Rolle hinzufügen
export const useAddRoleMember = () => {
  const protectedFetch = useProtectedFetch();

  const addRoleMember = useCallback(async (roleId: string, userId: string) => {
    const url = `${BASE_URL}/roles/${roleId}/members`;
    const responseText = await protectedFetch(url, "POST", { userId });

    if (!responseText || responseText === "Ressource geschützt") return false;
    
    return true;
  }, [protectedFetch]);

  return { addRoleMember };
};

// 3️⃣ Benutzer aus einer Rolle entfernen
export const useRemoveRoleMember = () => {
  const protectedFetch = useProtectedFetch();

  const removeRoleMember = useCallback(async (roleId: string, userId: string) => {
    const url = `${BASE_URL}/roles/${roleId}/members/${userId}`;
    const responseText = await protectedFetch(url, "DELETE");

    if (!responseText || responseText === "Ressource geschützt") return false;

    return true;
  }, [protectedFetch]);

  return { removeRoleMember };
};

// 4️⃣ Alle Benutzer abrufen (Für Mitglieder hinzufügen)
export const useGetAllUsers = () => {
  const protectedFetch = useProtectedFetch();

  const getAllUsers = useCallback(async () => {
    const url = `${BASE_URL}/users`;
    const responseText = await protectedFetch(url, "GET");

    if (!responseText || responseText === "Ressource geschützt") return [];

    try {
      const users = JSON.parse(responseText);

      // Füge das Profilbild für jeden Benutzer hinzu
      const enrichedUsers = users.map((user: any) => {
        if (!user.avatar || !user.discordId) {
          return { ...user, avatarURL: null }; // Falls kein Avatar vorhanden ist
        }

        const baseURL = "https://cdn.discordapp.com/avatars/";
        const avatarHash = user.avatar;
        const userId = user.discordId;
        const avatarExtension = avatarHash.startsWith("a") ? ".gif" : ".png";
        const avatarURL = `${baseURL}${userId}/${avatarHash}${avatarExtension}`;

        return { ...user, avatarURL };
      });

      return enrichedUsers;
    } catch (error) {
      console.error("Fehler beim Abrufen der Benutzerliste:", error);
      return [];
    }
  }, [protectedFetch]);

  return { getAllUsers };
};
