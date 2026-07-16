"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function RegisterRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token")?.trim();
    if (token) {
      router.replace(`/auth/signup?inviteToken=${encodeURIComponent(token)}`);
      return;
    }
    router.replace("/auth/signup");
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-brand-muted">Taking you to sign up…</p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-sm text-brand-muted">Loading…</p>
        </main>
      }
    >
      <RegisterRedirectInner />
    </Suspense>
  );
}
