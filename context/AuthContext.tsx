"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "admin" | "viewer" | null;

interface AuthContextType {
  user: string | null;
  role: Role;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    const savedRole = localStorage.getItem("auth_role") as Role;
    if (savedUser && savedRole) {
      setUser(savedUser);
      setRole(savedRole);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (password !== "123456") return false;

    if (username === "admin") {
      setUser("Admin");
      setRole("admin");
      localStorage.setItem("auth_user", "Admin");
      localStorage.setItem("auth_role", "admin");
      return true;
    }

    if (username === "patsy") {
      setUser("Patsy");
      setRole("viewer");
      localStorage.setItem("auth_user", "Patsy");
      localStorage.setItem("auth_role", "viewer");
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_role");
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
