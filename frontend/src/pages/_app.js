import React from "react";
import "../styles/globals.css"; // Dein globales CSS



function MyApp({ Component, pageProps }) {
  return (
    <div>
      <header>
        <nav>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/login">Login</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp;
