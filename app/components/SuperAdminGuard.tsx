"use client";

import { Skeleton } from "@/app/components/skeleton";
import { isSuperAdminUser } from "@/app/lib/is-super-admin-user";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function SuperAdminAccessSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const ok = isSuperAdminUser();
    setAllowed(ok);
    if (!ok) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!allowed) {
    return <SuperAdminAccessSkeleton />;
  }

  return <>{children}</>;
}
