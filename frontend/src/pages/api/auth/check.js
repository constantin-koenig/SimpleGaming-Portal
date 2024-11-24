// pages/api/auth/check.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { access_token, refresh_token } = req.cookies;

  if (!access_token && !refresh_token) {
    // Falls Tokens fehlen, sende einen 401-Status
    return res.status(401).json({ message: "Nicht authentifiziert, Weiterleitung zur Anmeldung" });
  }

  try {
    // Anfrage zur Token-Überprüfung an das Backend senden
    const backendResponse = await fetch(`${process.env.BACKEND_PRIVATE_API_URL}/auth/check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token} ${refresh_token}`, 
      },
    });

    const data = await backendResponse.json();

    if (backendResponse.ok) {
      // Überprüfung erfolgreich und neue Tokens zurückgegeben
      if (data.accessToken && data.refreshToken) {
        // Setze aktualisierte Tokens als HTTP-Only-Cookies
        res.setHeader('Set-Cookie', [
          `access_token=${data.accessToken}; HttpOnly; Path=/; Max-Age=${15 * 60}; Secure; SameSite=Strict`,
          `refresh_token=${data.refreshToken}; HttpOnly; Path=/; Max-Age=${30 * 86400}; Secure; SameSite=Strict`,
        ]);
      }

      // Sende die erhaltenen Daten zurück
      return res.status(200).json(data);

    } else {
      // Falls der Benutzer nicht authentifiziert ist, sende eine 401-Fehlermeldung
      if (backendResponse.status === 401) {
        return res.status(401).json({ message: "Nicht authentifiziert, Weiterleitung zur Anmeldung" });
      } else {
        // Anderen Fehlerstatus und Nachricht vom Backend weitergeben
        return res.status(backendResponse.status).json({ message: data.message || "Fehler bei der Token-Überprüfung" });
      }
    }

  } catch (error) {
    console.error("Fehler bei der Authentifizierungsüberprüfung:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
