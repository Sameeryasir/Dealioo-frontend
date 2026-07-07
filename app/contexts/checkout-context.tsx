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
import { useSearchParams } from "next/navigation";
import {
  getCheckoutSession,
  type CheckoutSessionDetails,
} from "@/app/services/payment/checkout-session";

type CheckoutContextValue = {
  checkoutToken: string | null;
  session: CheckoutSessionDetails | null;
  ready: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const checkoutToken = searchParams.get("checkoutToken")?.trim() || null;

  const [session, setSession] = useState<CheckoutSessionDetails | null>(null);
  const [ready, setReady] = useState(!checkoutToken);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async (options?: { background?: boolean }) => {
    if (!checkoutToken) {
      setSession(null);
      setError(null);
      setReady(true);
      return;
    }

    if (!options?.background) {
      setReady(false);
    }
    setError(null);

    try {
      const details = await getCheckoutSession(checkoutToken);
      setSession(details);
    } catch (err) {
      setSession(null);
      setError(
        err instanceof Error
          ? err.message
          : "This checkout link is invalid or has expired.",
      );
    } finally {
      setReady(true);
    }
  }, [checkoutToken]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const refreshSession = useCallback(async () => {
    await loadSession({ background: true });
  }, [loadSession]);

  const value = useMemo(
    (): CheckoutContextValue => ({
      checkoutToken,
      session,
      ready,
      error,
      refreshSession,
    }),
    [checkoutToken, session, ready, error, refreshSession],
  );

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
}

export function useCheckoutContext(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (!context) {
    return {
      checkoutToken: null,
      session: null,
      ready: true,
      error: null,
      refreshSession: async () => {},
    };
  }
  return context;
}
