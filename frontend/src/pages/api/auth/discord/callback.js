// pages/api/auth/callback.js
let fetch;
if (!fetch) {
  // Dynamischer Import, um `node-fetch` zu laden
  fetch = (await import('node-fetch')).default;
}
export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: "Kein Authorization Code erhalten" });
  }

  try {
    // Authorization Code an das Backend weiterleiten
    const backendApiUrl = `${process.env.BACKEND_PRIVATE_API_URL}/auth/discord`;
    const response = await fetch(backendApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Fehler bei der Kommunikation mit dem Backend');
    }

    const data = await response.json();
    if (data.accessToken && data.refreshToken) {
      // Setze Cookies im Server-Response-Header
      res.setHeader('Set-Cookie', [
        `access_token=${data.accessToken}; HttpOnly; Max-Age=${15 * 60}; Path=/; Secure; SameSite=Strict`,
        `refresh_token=${data.refreshToken}; HttpOnly; Max-Age=${30 * 86400}; Path=/; Secure; SameSite=Strict`,
      ]);

      // Weiterleitung auf das Dashboard
      res.redirect('/dashboard');
    } else {
      res.status(400).json({ message: "Token konnte nicht erstellt werden" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fehler bei der Authentifizierung" });
  }
}
