import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const useProtectedFetch = () => {
  const { accessToken, renewAccessToken } = useAuth();
  const navigate = useNavigate();

  const fetchProtectedResource = async (
    resourceUrl: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ) => {
    try {
      let token = accessToken;
      console.log("Aktuelles Access Token:", token);

      if (!token) {
        token = await renewAccessToken();
        console.log("Token erneuert:", token);
      }

      if (!token) {
        console.error("Kein gültiger Token erhalten.");
        navigate("/login");
        return null;
      }

      const fetchOptions: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      let response = await fetch(resourceUrl, fetchOptions);

      // Falls das Token abgelaufen ist, versuchen wir es zu erneuern und den Request erneut zu senden
      if (response.status === 401) {
        console.warn("Token ungültig, erneuere Token...");
        token = await renewAccessToken();

        if (!token) {
          console.error("Token-Erneuerung fehlgeschlagen.");
          navigate("/login");
          return null;
        }

        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${token}`,
        };

        response = await fetch(resourceUrl, fetchOptions);

        if (!response.ok) {
          throw new Error("Fehler nach Token-Erneuerung.");
        }
        console.log("Neuer Versuch erfolgreich");
      }

      if (response.status === 403) {
        console.warn("Zugriff verweigert: Ressource geschützt.");
        return "Ressource geschützt";
      }

      if (response.ok) {
        return await response.text();
      }

      throw new Error(`Fehler beim Abrufen der geschützten Ressource: ${response.status}`);
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return fetchProtectedResource;
};
