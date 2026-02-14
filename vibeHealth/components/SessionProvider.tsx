"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getToken, saveToken } from "@/lib/auth-client";

interface SessionContextType {
  token: string | null;
  userId: string | null;
  role: string | null;
  setSession: (token: string, userId: string, role: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType>({
  token: null,
  userId: null,
  role: null,
  setSession: () => {},
  clearSession: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // VULN [Cat 14]: Reading auth data from localStorage
    const stored = getToken();
    if (stored) {
      setToken(stored);
      setUserId(localStorage.getItem("user_id"));
      setRole(localStorage.getItem("user_role"));
    }
  }, []);

  const setSession = (newToken: string, newUserId: string, newRole: string) => {
    // VULN [Cat 14]: Storing sensitive auth data in localStorage
    saveToken(newToken);
    localStorage.setItem("user_id", newUserId);
    localStorage.setItem("user_role", newRole);
    setToken(newToken);
    setUserId(newUserId);
    setRole(newRole);
  };

  const clearSession = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    setToken(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <SessionContext.Provider value={{ token, userId, role, setSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
