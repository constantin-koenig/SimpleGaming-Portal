import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Holen der Access Token aus Cookies
    const accessToken = document.cookie.split("; ").find(row => row.startsWith("access_token")).split("=")[1];

    if (!accessToken) {
      router.push("/login"); // Wenn kein Access Token vorhanden, zum Login weiterleiten
    }

    // Abrufen der Benutzer aus dem Backend
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error("Fehler beim Abrufen der Benutzer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard - Benutzerübersicht</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
