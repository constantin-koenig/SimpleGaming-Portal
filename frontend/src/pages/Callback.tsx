import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Callback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/callback", {
          withCredentials: true, // Cookies werden automatisch gesetzt
        });
        if (response.status === 200) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Tokens", error);
        navigate("/");
      }
    };

    fetchTokens();
  }, [navigate]);

  return <div>Lade...</div>;
};

export default Callback;
