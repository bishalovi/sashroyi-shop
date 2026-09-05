"use client";

import { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("barakahUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("barakahUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    toast.success("Logged out successfully!", {
      position: "top-right",
    });
    localStorage.removeItem("barakahUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
