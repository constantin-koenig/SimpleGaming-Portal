import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const { accessToken, renewAccessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProtectedContent = async () => {
      try {
        let token = accessToken;

        console.log("Current access token:1", token);

        // Wenn kein Access Token vorhanden ist oder erneuert werden muss
        if (!token) {
          token = await renewAccessToken(); // Hole einen neuen Token
          console.log("Erneuere token:2", token);
        }

        if (!token) {
          console.error("Kein gültiger Token erhalten.");
          navigate("/");
          return;
        }

        console.log("Verwende Access Token:", token);

        // Abrufen der geschützten Inhalte
        const response = await fetch("http://localhost:5000/api/protected/user/dashboard", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.text();
          setContent(data);
        } else {
          console.error("Fehler beim Abrufen der geschützten Ressource.");
          navigate("/");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der geschützten Ressource:", error);
        navigate("/");
      } finally {
        setIsLoading(false); // Ladezustand beenden
      }
    };

    fetchProtectedContent();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg text-gray-700">{content}</p>
    </div>
  );
};

export default ProtectedRoute;
