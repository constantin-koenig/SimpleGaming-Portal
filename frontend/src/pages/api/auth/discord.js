// pages/api/auth/discord.js
export default async function handler(req, res) {
    try {
      // Weiterleitung an das Backend für die Discord-Authentifizierung
      const backendUrl = `http://localhost:5000/auth/discord`;
  
      // Optional: Hier kannst du auch zusätzliche Header oder Cookies hinzufügen, wenn erforderlich
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        // Wenn die Antwort erfolgreich ist, leite den Benutzer zur Discord-Auth-URL weiter
        const redirectUrl = await response.text();
        res.redirect(redirectUrl);
      } else {
        res.status(500).json({ message: 'Fehler bei der Weiterleitung zur Discord-Auth.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Fehler bei der API-Anfrage an das Backend' });
    }
  }
  