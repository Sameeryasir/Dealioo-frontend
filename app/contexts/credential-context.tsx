"use client";

import { clearAuthSession } from "@/app/lib/auth-session";
import { clearSetupUser } from "@/app/lib/setup-user";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CredentialContextValue = {
  email: string;
  password: string;
  setCredentials: (email: string, password: string) => void;
  rememberCredentials: (email: string, password: string) => void;
  clearPassword: () => void;
};

const CredentialContext = createContext<CredentialContextValue | null>(null);

export function CredentialProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPasswordState] = useState("");

  const setCredentials = useCallback((nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPasswordState(nextPassword);
    clearAuthSession();
    clearSetupUser();
  }, []);

  const rememberCredentials = useCallback((nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPasswordState(nextPassword);
  }, []);

  const clearPassword = useCallback(() => {
    setPasswordState("");
  }, []);

  const value = useMemo(
    () => ({
      email,
      password,
      setCredentials,
      rememberCredentials,
      clearPassword,
    }),
    [email, password, setCredentials, rememberCredentials, clearPassword],
  );

  return (
    <CredentialContext.Provider value={value}>
      {children}
    </CredentialContext.Provider>
  );
}

export function useCredentialContext(): CredentialContextValue {
  const ctx = useContext(CredentialContext);
  if (!ctx) {
    throw new Error(
      "useCredentialContext must be used within CredentialProvider",
    );
  }
  return ctx;
}
