"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      let storedUser = null;
      if (typeof window !== "undefined") {
        storedUser = localStorage.getItem("barakahUser");
        // Fallback to cookie if localStorage is empty or cleared
        if (!storedUser && document.cookie) {
          const match = document.cookie.match(new RegExp("(?:^|; )barakahUser=([^;]*)"));
          if (match) {
            storedUser = decodeURIComponent(match[1]);
          }
        }
      }

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Ensure both localStorage and long-lived cookie stay synced (1 year)
        if (typeof window !== "undefined") {
          localStorage.setItem("barakahUser", JSON.stringify(parsed));
          document.cookie = `barakahUser=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("barakahUser", JSON.stringify(userData));
        document.cookie = `barakahUser=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch (e) {
      console.error("Error storing auth session:", e);
    }
  };

  const logout = () => {
    setUser(null);
    toast.success("Logged out successfully!", {
      position: "top-right",
    });
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("barakahUser");
        document.cookie = "barakahUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch (e) {
      console.error("Error removing auth session:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

