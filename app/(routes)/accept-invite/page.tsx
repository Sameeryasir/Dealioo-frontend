"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { hasAuthSession } from "@/app/lib/auth-session";
import { getApiErrorMessage } from "@/app/lib/toast-api-error";
import { acceptBusinessMemberInvite } from "@/app/services/member/business-members";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Accepting your invitation…");
  const [businessId, setBusinessId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This invitation link is invalid or missing a token.");
      return;
    }

    if (!hasAuthSession()) {
      const returnTo = encodeURIComponent(`/accept-invite?token=${token}`);
      router.replace(`/?returnTo=${returnTo}`);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await acceptBusinessMemberInvite(token);
        if (cancelled) return;
        setStatus("success");
        setMessage(result.message);
        setBusinessId(result.businessId > 0 ? result.businessId : null);
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          getApiErrorMessage(error, "Could not accept the invitation."),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.25rem] border border-[#e8edf5] bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
        {status === "loading" ? (
          <Loader2
            className="mx-auto size-10 animate-spin text-[#1877f2]"
            aria-hidden
          />
        ) : status === "success" ? (
          <CheckCircle2
            className="mx-auto size-10 text-emerald-600"
            aria-hidden
          />
        ) : (
          <AlertCircle className="mx-auto size-10 text-red-500" aria-hidden />
        )}

        <h1 className="mt-4 text-lg font-bold text-[#07111f]">
          {status === "loading"
            ? "Accepting invitation"
            : status === "success"
              ? "Invitation accepted"
              : "Invitation failed"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>

        {status === "success" && businessId != null ? (
          <Link
            href={`/business/${businessId}/dashboard`}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#1877f2] px-4 text-sm font-semibold text-white no-underline transition hover:bg-[#0d5bb8]"
          >
            Go to business dashboard
          </Link>
        ) : null}

        {status === "error" ? (
          <Link
            href="/dashboard"
            className="mt-5 inline-flex h-10 items-center rounded-xl border border-[#e8edf5] px-4 text-sm font-semibold text-slate-700 no-underline transition hover:bg-[#f8fafc]"
          >
            Back to dashboard
          </Link>
        ) : null}
      </div>
    </main>
  );
}
