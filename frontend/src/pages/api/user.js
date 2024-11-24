// pages/api/user.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ message: "Nicht autorisiert" });
  }

  try {
    // Anfrage an das Backend mit dem access_token
    const backendApiUrl = `${process.env.BACKEND_PRIVATE_API_URL}/auth/userinfo`;
    const response = await fetch(backendApiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Fehler beim Abrufen der Benutzerdaten vom Backend");
    }
    const userData = await response.json();
    res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Fehler bei der Anfrage" });
  }
}
