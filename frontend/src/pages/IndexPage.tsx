import React from "react";
import { Link } from "react-router-dom";

const IndexPage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the SimpleGaming Portal</h1>
      <p>
        Please <Link to="/login">log in</Link> to continue.
      </p>
    </div>
  );
};

export default IndexPage;