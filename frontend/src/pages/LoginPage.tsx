import React from "react";

const IndexPage: React.FC = () => {
  const handleDiscordLogin = () => {
    const DISCORD_AUTH_URL = "http://localhost:5000/api/auth/discord";
    window.location.href = DISCORD_AUTH_URL;
  };

  return (
    <div>
      <h1>Willkommen beim SimpleGaming-Portal</h1>
      <button onClick={handleDiscordLogin}>Mit Discord anmelden</button>
    </div>
  );
};

export default IndexPage;
