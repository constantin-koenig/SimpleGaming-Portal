// Seiten-API-Callback, die den Code an das Backend weiterleitet
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Kein Authorization Code erhalten" });
  }

  try {
    // Leite den Authorization Code an das Backend weiter
    const backendApiUrl = `${process.env.BACKEND_PRIVATE_API_URL}/auth/discord`;
    console.error(code);
    // Stelle sicher, dass du die Daten im richtigen Format sendest
    const response = await fetch(backendApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }), // Sende nur den Code als Parameter
    });

    if (!response.ok) {
      throw new Error('Fehler bei der Kommunikation mit dem Backend');
    }

    const data = await response.json();
    if (data.token) {
      res.status(200).json({ message: "Erfolgreich eingeloggt", token: data.token });
    } else {
      res.status(400).json({ message: "Token konnte nicht erstellt werden" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fehler bei der Authentifizierung" });
  }
}
