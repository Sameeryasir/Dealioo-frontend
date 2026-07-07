"use client";

import {
  AUTH_SESSION_CHANGED_EVENT,
  hasAuthSession,
} from "@/app/lib/auth-session";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthContextValue = {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  syncAuthSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const syncAuthSession = useCallback(() => {
    setIsAuthenticated(hasAuthSession());
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    syncAuthSession();

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthSession);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncAuthSession);
    };
  }, [syncAuthSession]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isAuthReady,
      syncAuthSession,
    }),
    [isAuthenticated, isAuthReady, syncAuthSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
