// utils/auth.js

export const checkAuth = async () => {
  try {
    // Anfrage an /api/auth/user, um die Benutzerdaten zu überprüfen (einschließlich Token)
    const response = await fetch("/api/user", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Cookies werden gesendet
    });

    if (response.ok) {
      const data = await response.json();
      return { isAuthenticated: true, user: data }; // Erfolgreich authentifiziert
    } else {
      return { isAuthenticated: false }; // Kein gültiges Token
    }
  } catch (error) {
    console.error("Fehler bei der Authentifizierung:", error);
    return { isAuthenticated: false }; // Fehler bei der Anfrage
  }
};

// Überprüft, ob der Benutzer die richtige Rolle hat
export const checkRole = async (requiredRole) => {
  const authResult = await checkAuth(); // Zuerst die Authentifizierung überprüfen
  if (!authResult.isAuthenticated) {
    return false; // Wenn der Benutzer nicht authentifiziert ist
  }

  const user = authResult.user;

  // Überprüft, ob die Benutzerrolle der erforderlichen Rolle entspricht
  if (user && user.role === requiredRole) {
    return true; // Der Benutzer hat die richtige Rolle
  } else {
    return false; // Der Benutzer hat nicht die richtige Rolle
  }
};
