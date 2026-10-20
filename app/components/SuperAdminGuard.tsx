"use client";

import { isSuperAdminUser } from "@/app/lib/is-super-admin-user";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

const subscribeNoop = () => () => {};

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const allowed = useSyncExternalStore(
    subscribeNoop,
    isSuperAdminUser,
    () => false,
  );

  useEffect(() => {
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-[#5b6b7c]">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
