import React from "react";
import { Link } from "react-router-dom";

const IndexPage: React.FC = () => {
  return (
    <div>
      <h1>Willkommen beim SimpleGaming-Portal</h1>
      <p>
        Bitte <Link to="/login">einloggen</Link>, um fortzufahren.
      </p>
    </div>
  );
};

export default IndexPage;
