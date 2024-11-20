import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css"; // Dein globaler CSS-Datei

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Hier könntest du auch globale Authentifizierungs-Checks machen
    // z.B. ob der Benutzer angemeldet ist oder ob er auf der richtigen Seite ist
    const checkAuth = () => {
      const accessToken = document.cookie.split("; ").find(row => row.startsWith("access_token"));
      if (!accessToken && router.pathname !== "/login") {
        router.push("/login"); // Falls nicht eingeloggt, weiterleiten zum Login
      }
    };

    checkAuth();
  }, [router]);

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
