import React, { createContext, useContext, useCallback, useState, ReactNode } from "react";

interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  renewAccessToken : () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const renewAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
  
      if (!refreshResponse.ok) {
        return null;
      }
  
      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.access_token;
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      return null;
    }
  }, [accessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, renewAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
