/**
 * Authentication Context
 *
 * Provides auth state (token, isAuthenticated) to the entire app.
 * Persists the JWT in localStorage and exposes login/logout helpers.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ── Types ── */
interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Provider ── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate token from localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setToken(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (newToken: string) => {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/signin");
  }, [router]);

  const value: AuthContextValue = {
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
