// pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  return (
    <div>
      <h1>Willkommen, {user?.username}!</h1>
      <p>Testseite:</p>
      <ul>
        <li>ID: {user?.id}</li>
        <li>Name: {user?.username}</li>
        <li>Email: {user?.email}</li>
        <li>Rolle: {user?.role}</li>
      </ul>
    </div>
  );
};

export default Dashboard;
