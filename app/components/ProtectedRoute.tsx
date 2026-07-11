"use client";

import { hasAuthSession } from "@/app/lib/auth-session";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function readAuthSession(): boolean | null {
  if (typeof window === "undefined") return null;
  return hasAuthSession();
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    readAuthSession,
  );

  useEffect(() => {
    const authed = hasAuthSession();
    setIsAuthenticated(authed);

    if (!authed) {
      const returnTo = encodeURIComponent(pathname);
      router.replace(`/?returnTo=${returnTo}`);
    }
  }, [pathname, router]);

  if (isAuthenticated === false) {
    return null;
  }

  return <>{children}</>;
}
