import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth"

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/user", {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (error) {
        console.error("Benutzerdaten konnten nicht geladen werden", error);
        navigate("/");
      }

      const authenticated = useAuth();
if (!authenticated) {
  navigate("/");
  return null;
}

    };

    fetchUserData();
  }, [navigate]);

  return (
    <div>
      <h1>Dashboard</h1>
      {userData ? (
        <pre>{JSON.stringify(userData, null, 2)}</pre>
      ) : (
        <p>Lade Daten...</p>
      )}
    </div>
  );
};

export default Dashboard;
