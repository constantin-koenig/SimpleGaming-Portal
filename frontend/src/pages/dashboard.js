// pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include",
        });
        
        if (response.ok) {
          console.log("Token ist gültig.");

          // Benutzerdaten abrufen, wenn die Authentifizierung erfolgreich ist
          const userDataResponse = await fetch("/api/user", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Cookies werden mitgesendet
          });

          if (userDataResponse.ok) {
            const data = await userDataResponse.json();
            setUser(data);
          } else {
            console.error("Fehler beim Abrufen der Benutzerdaten.");
          }
        } else if (response.status === 401) {
          console.error("Nicht authentifiziert, Weiterleitung zur Login-Seite");
          router.push("/login");
        } else {
          console.error("Fehler bei der Authentifizierungsüberprüfung:", await response.json());
        }
      } catch (error) {
        console.error("Fehler bei der Authentifizierung:", error);
      } finally {
        setLoading(false); // Ladevorgang beenden, nachdem alle Aktionen abgeschlossen sind
      }
    };

    checkAuthentication();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Willkommen, {user?.username}!</h1>
      <p>Hier sind deine Informationen:</p>
      <ul>
        <li>ID: {user?.id}</li>
        <li>Name: {user?.username}</li>
        <li>Email: {user?.email}</li>
        <li>Rolle: {user?.role}</li>
        <li>Avatar URL: {user?.avatarURL}</li>
        {user?.avatarURL && <img src={user.avatarURL} alt={`${user.username}'s avatar`} />}
      </ul>
    </div>
  );
};

export default Dashboard;
