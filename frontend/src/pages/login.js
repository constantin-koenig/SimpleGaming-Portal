// pages/login.js
import React from "react";

const Login = () => {
  const handleLogin = async () => {
    try {
      // Anfrage an die Next.js API-Route, die das Backend aufruft
      const res = await fetch("/api/auth/discord");

      if (res.ok) {
        // Wenn die Antwort erfolgreich ist, wird der Benutzer zu Discord weitergeleitet
        window.location.href = res.url;
      } else {
        console.error("Fehler beim Weiterleiten zur Discord-Auth.");
      }
    } catch (error) {
      console.error("Fehler bei der Anfrage:", error);
    }
  };

  return (
    <div>
      <h1>Login mit Discord</h1>
      <button onClick={handleLogin}>Mit Discord einloggen</button>
    </div>
  );
};

export default Login;
