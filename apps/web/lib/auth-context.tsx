"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@fixitnow/types";
import { api, ApiError, setAccessToken } from "./apiClient";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signup: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  /** Force a re-read of the current user from /auth/me. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const bootstrap = useCallback(async () => {
    setStatus("loading");
    try {
      const me = await api.auth.bootstrap();
      setUser(me);
      setStatus(me ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const signup: AuthContextValue["signup"] = useCallback(async (input) => {
    const res = await api.auth.signup(input);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const login: AuthContextValue["login"] = useCallback(async (input) => {
    try {
      const res = await api.auth.login(input);
      setUser(res.user);
      setStatus("authenticated");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw new Error("Invalid email or password");
      }
      throw err;
    }
  }, []);

  const logout: AuthContextValue["logout"] = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const refresh: AuthContextValue["refresh"] = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      setStatus(me ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signup, login, logout, refresh }),
    [status, user, signup, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
