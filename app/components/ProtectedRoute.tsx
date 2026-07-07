"use client";

import { hasAuthSession } from "@/app/lib/auth-session";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    queueMicrotask(() => {
      if (hasAuthSession()) {
        setStatus("authenticated");
        return;
      }

      setStatus("unauthenticated");
      const returnTo = encodeURIComponent(pathname);
      router.replace(`/?returnTo=${returnTo}`);
    });
  }, [pathname, router]);

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <p className="text-sm text-brand-muted">Redirecting…</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <p className="text-sm text-brand-muted">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
