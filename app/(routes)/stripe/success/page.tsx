"use client";

import { ArrowRight, Check, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

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

export default function StripeConnectSuccessPage() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(99,91,255,0.35),transparent_55%),radial-gradient(700px_circle_at_50%_120%,rgba(16,185,129,0.18),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,rgba(9,9,11,0.6)_60%,rgba(9,9,11,1))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      <div className="relative w-full max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-10">
          <div className="relative mx-auto mb-8 flex size-24 items-center justify-center sm:size-28">
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 [animation-duration:2.4s]"
            />
            <span
              aria-hidden
              className="absolute inset-2 rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/25"
            />
            <span
              aria-hidden
              className="absolute inset-4 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30"
            />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 ring-1 ring-white/30">
              <Check className="size-7" strokeWidth={3} aria-hidden />
            </span>
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="size-3.5" strokeWidth={2.25} aria-hidden />
              Account verified
            </span>

            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              You&rsquo;re ready to accept payments.
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
              Your account is connected with{" "}
              <span className="inline-flex translate-y-[1px] items-baseline">
                <StripeWordmark className="ml-px h-3.5 w-auto text-zinc-200" />
              </span>
              . Funnel checkouts will now route customer payments straight to your
              Stripe balance.
            </p>
          </div>

          <ul className="mx-auto mt-8 grid gap-3 text-left sm:grid-cols-3">
            {[
              {
                title: "Live checkout",
                body: "All published funnels can collect real payments now.",
              },
              {
                title: "Secure payouts",
                body: "Funds arrive on Stripe\u2019s standard payout schedule.",
              },
              {
                title: "Manage anywhere",
                body: "Refunds & disputes are handled in your Stripe dashboard.",
              },
            ].map((s) => (
              <li
                key={s.title}
                className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                  {s.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {s.body}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-zinc-900 shadow-[0_8px_30px_rgba(255,255,255,0.12)] ring-1 ring-zinc-200/40 transition-all hover:bg-zinc-100 active:translate-y-px"
            >
              Go to Dashboard
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.25}
                aria-hidden
              />
            </Link>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-zinc-100 transition-all hover:border-white/25 hover:bg-white/[0.06]"
            >
              Open Stripe Dashboard
              <ExternalLink className="size-4 text-zinc-400" strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          You can safely close this tab, your account stays connected.
        </p>
      </div>
    </main>
  );
}
