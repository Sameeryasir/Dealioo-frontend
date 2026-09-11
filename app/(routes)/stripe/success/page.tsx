"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";

import {
  STRIPE_CONNECT_CANCELLED_MESSAGE,
  STRIPE_CONNECT_COMPLETE_MESSAGE,
} from "@/app/lib/stripe-oauth-popup";

function StripeWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 25"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Stripe"
      className={className}
    >
      <path
        fill="currentColor"
        d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.13V9.1h-3.12v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.13 1.31 4.46 1.31.9 0 1.54-.24 1.54-.99 0-1.94-6.15-1.2-6.15-5.69 0-2.92 2.2-4.66 5.55-4.66 1.34 0 2.68.2 4.02.74v3.88a9.18 9.18 0 0 0-4.02-1.05c-.84 0-1.36.25-1.36.88 0 1.84 6.15.96 6.15 5.78z"
      />
    </svg>
  );
}

function StripeConnectSuccessInner() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error")?.trim() || null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const opener = window.opener;
    if (!opener || opener.closed) return;

    try {
      opener.postMessage(
        {
          type: oauthError
            ? STRIPE_CONNECT_CANCELLED_MESSAGE
            : STRIPE_CONNECT_COMPLETE_MESSAGE,
        },
        window.location.origin,
      );
      opener.focus();
    } catch {
      /* ignore */
    }
    window.close();
  }, [oauthError]);

  if (oauthError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8faff] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#e8edf5] bg-white p-8 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <XCircle className="size-6" strokeWidth={2} aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
            Stripe connection cancelled
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            You can close this window and try again in Dealioo.
          </p>
          <button
            type="button"
            className="mt-6 w-full cursor-pointer rounded-xl bg-[#1877f2] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5ed7]"
            onClick={() => window.close()}
          >
            Close
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#f8faff] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(24,119,242,0.12),transparent_55%),radial-gradient(700px_circle_at_50%_120%,rgba(99,91,255,0.08),transparent_60%)]"
      />

      <div className="relative w-full max-w-xl">
        <div className="rounded-3xl border border-[#e8edf5] bg-white p-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="relative mx-auto mb-8 flex size-24 items-center justify-center sm:size-28">
            <span className="relative flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <Check className="size-7" strokeWidth={3} aria-hidden />
            </span>
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="size-3.5" strokeWidth={2.25} aria-hidden />
              Account connected
            </span>

            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              You&rsquo;re ready to accept payments.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-slate-500 sm:text-base">
              Your account is connected with{" "}
              <span className="inline-flex translate-y-[1px] items-baseline">
                <StripeWordmark className="ml-px h-3.5 w-auto text-[#635BFF]" />
              </span>
              . You can close this window and continue in Dealioo.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5ed7]"
            >
              Go to Dashboard
              <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
            </Link>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open Stripe Dashboard
              <ExternalLink className="size-4 text-slate-400" strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          You can safely close this tab — your Stripe account stays connected.
        </p>
      </div>
    </main>
  );
}

export default function StripeConnectSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#f8faff]" aria-hidden />}>
      <StripeConnectSuccessInner />
    </Suspense>
  );
}
