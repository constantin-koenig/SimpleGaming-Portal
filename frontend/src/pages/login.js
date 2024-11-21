// pages/login.js
import React from "react";

const Login = () => {
  const handleLogin = () => {
    window.location.href = "/api/auth/discord"; // Weiterleitung zur API-Route
  };

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Mit Discord anmelden</button>
    </div>
  );
};

export default Login;
