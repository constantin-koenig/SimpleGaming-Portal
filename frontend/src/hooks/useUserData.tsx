import { useState, useEffect } from "react";
import { useProtectedFetch } from "./useProtectedFetch";

export type UserInfo = {
  globalname: string;
  avatar: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  discordId: string;
};

export const useUserData = () => {
  const fetchProtectedResource = useProtectedFetch();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);

    const data = await fetchProtectedResource("/api/protected/users/me/userinfo");

    if (data === "Ressource geschützt") {
      setError("Zugriff verweigert. Bitte überprüfe deine Berechtigungen.");
      setLoading(false);
      return;
    }

    if (data) {
      try {
        const parsedData = JSON.parse(data);
        const baseURL = "https://cdn.discordapp.com/avatars/";
        const avatarHash = parsedData.avatar;
        const userId = parsedData.discordId;
        const avatarExtension = avatarHash.startsWith("a") ? ".gif" : ".png";
        const avatarURL = `${baseURL}${userId}/${avatarHash}${avatarExtension}`;

        setUserInfo({
          globalname: parsedData.globalname,
          avatar: avatarURL,
          email: parsedData.email,
          username: parsedData.username,
          createdAt: new Date(parsedData.createdAt),
          updatedAt: new Date(parsedData.updatedAt),
          discordId: parsedData.discordId,
        });
      } catch (error) {
        console.error("Fehler beim Parsen der Benutzerdaten:", error);
        setError("Fehler beim Laden der Benutzerdaten.");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return { userInfo, error, loading, refetch: fetchUserInfo };
};
