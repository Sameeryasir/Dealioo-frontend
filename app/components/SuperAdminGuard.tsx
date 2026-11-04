"use client";

import { isSuperAdminUser } from "@/app/lib/is-super-admin-user";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(() =>
    typeof window === "undefined" ? false : isSuperAdminUser(),
  );

  useEffect(() => {
    const ok = isSuperAdminUser();
    setAllowed(ok);
    if (!ok) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-[#5b6b7c]">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
