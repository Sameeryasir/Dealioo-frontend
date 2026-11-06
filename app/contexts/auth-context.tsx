"use client";

import {
  AUTH_SESSION_CHANGED_EVENT,
  clearAuthSession,
  hasAuthSession,
} from "@/app/lib/auth-session";
import { subscribeAuthBroadcast } from "@/app/lib/auth-broadcast";
import { MemberAccessRemovedListener } from "@/app/components/MemberAccessRemovedListener";
import { MemberRoleUpdatedListener } from "@/app/components/MemberRoleUpdatedListener";
import { verifyAuthSession } from "@/app/services/auth/verify-session";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  user: VerifyOtpUser | null;
  errorMessage: string | null;
  syncAuthSession: () => void;
  revalidateAuthSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const REVALIDATE_COOLDOWN_MS = 1500;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<VerifyOtpUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusRef = useRef<AuthStatus>("loading");
  const verifyGenerationRef = useRef(0);
  const lastRevalidateAtRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const clearingRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const applyUnauthenticated = useCallback(() => {
    setUser(null);
    setErrorMessage(null);
    setStatus("unauthenticated");
    if (hasAuthSession()) {
      clearingRef.current = true;
      try {
        clearAuthSession();
      } finally {
        clearingRef.current = false;
      }
    }
  }, []);

  const revalidateAuthSession = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    const now = Date.now();
    if (
      statusRef.current !== "loading" &&
      statusRef.current !== "error" &&
      now - lastRevalidateAtRef.current < REVALIDATE_COOLDOWN_MS
    ) {
      return;
    }
    lastRevalidateAtRef.current = now;

    const generation = ++verifyGenerationRef.current;
    const run = (async () => {
      if (statusRef.current === "error") {
        setStatus("loading");
      }

      const result = await verifyAuthSession();
      if (generation !== verifyGenerationRef.current) return;

      if (result.status === "authenticated") {
        setUser(result.user);
        setErrorMessage(null);
        setStatus("authenticated");
        return;
      }

      if (result.status === "unauthenticated") {
        applyUnauthenticated();
        return;
      }

      setErrorMessage(result.message);
      setStatus("error");
    })();

    inFlightRef.current = run;
    try {
      await run;
    } finally {
      if (inFlightRef.current === run) {
        inFlightRef.current = null;
      }
    }
  }, [applyUnauthenticated]);

  const syncAuthSession = useCallback(() => {
    if (!hasAuthSession()) {
      setUser(null);
      setErrorMessage(null);
      setStatus("unauthenticated");
      return;
    }
    void revalidateAuthSession();
  }, [revalidateAuthSession]);

  useEffect(() => {
    void revalidateAuthSession();

    const onLocalSessionChange = () => {
      if (clearingRef.current) return;
      if (!hasAuthSession()) {
        setUser(null);
        setErrorMessage(null);
        setStatus("unauthenticated");
        return;
      }
      void revalidateAuthSession();
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onLocalSessionChange);
    const unsubscribeBroadcast = subscribeAuthBroadcast((message) => {
      if (message.action === "cleared") {
        setUser(null);
        setErrorMessage(null);
        setStatus("unauthenticated");
        return;
      }
      void revalidateAuthSession();
    });

    return () => {
      verifyGenerationRef.current += 1;
      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        onLocalSessionChange,
      );
      unsubscribeBroadcast();
    };
  }, [revalidateAuthSession]);

  const isAuthenticated = status === "authenticated";
  const isAuthReady = status !== "loading";

  const value = useMemo(
    () => ({
      status,
      isAuthenticated,
      isAuthReady,
      user,
      errorMessage,
      syncAuthSession,
      revalidateAuthSession,
    }),
    [
      status,
      isAuthenticated,
      isAuthReady,
      user,
      errorMessage,
      syncAuthSession,
      revalidateAuthSession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isAuthenticated ? <MemberAccessRemovedListener /> : null}
      {isAuthenticated ? <MemberRoleUpdatedListener /> : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
