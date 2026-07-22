"use client";

import { SearchX, UserPlus, UserRound, Sparkles } from "lucide-react";

type GuestNotInDatabasePanelProps = {
  searchQuery?: string;
  onCreateGuest?: () => void;
  onSearchAgain?: () => void;
  onScanAgain?: () => void;
};

export function GuestNotInDatabasePanel({
  searchQuery,
  onCreateGuest,
  onSearchAgain,
  onScanAgain,
}: GuestNotInDatabasePanelProps) {
  const trimmedQuery = searchQuery?.trim();

  return (
    <div className="overflow-hidden rounded-3xl border border-[#0a1628]/20 bg-white shadow-lg shadow-[0_16px_40px_rgba(7,17,31,0.14)] ring-1 ring-[#07111f]/10">
      <div
        className="relative overflow-hidden px-5 py-4 text-white sm:px-6 sm:py-5"
        style={{
          background:
            "linear-gradient(180deg, #07111f 0%, #0a1628 52%, #0f1f3d 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 40% at 50% 0%, rgba(24, 119, 242, 0.28) 0%, transparent 70%), radial-gradient(ellipse 120% 35% at 50% 100%, rgba(244, 114, 182, 0.16) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative flex items-center gap-2 text-white/70">
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em]">
            Not in your database
          </p>
        </div>

        <h2 className="relative mt-1.5 max-w-lg text-xl font-bold leading-tight sm:text-2xl">
          This guest hasn&apos;t been saved yet
        </h2>

        <p className="relative mt-1.5 max-w-xl text-sm leading-snug text-white/80">
          {trimmedQuery ? (
            <>
              We looked for{" "}
              <span className="font-semibold text-white">
                &ldquo;{trimmedQuery}&rdquo;
              </span>{" "}
              but no profile exists in Dealioo.
            </>
          ) : (
            <>
              No matching guest profile exists in Dealioo. They may not have
              signed up through your deal page yet.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 px-5 py-6 sm:grid-cols-3 sm:px-6">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4 text-center">
          <p className="text-2xl font-bold text-zinc-900">0</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Saved profiles
          </p>
        </div>
        <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-4 text-center">
          <p className="text-2xl font-bold text-[#1877f2]">New</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#1877f2]/70">
            Guest status
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4 text-center">
          <UserRound className="mx-auto size-6 text-zinc-400" aria-hidden />
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Add manually
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1877f2] shadow-sm ring-1 ring-[#1877f2]/15">
            <SearchX className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 text-sm leading-relaxed text-zinc-600">
            <p className="font-medium text-zinc-900">What you can do next</p>
            <p className="mt-1">
              Guests are saved when they complete signup on your campaign funnel,
              or when you create them here at the scanner.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {onCreateGuest ? (
            <button
              type="button"
              onClick={onCreateGuest}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1877f2] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
            >
              <UserPlus className="size-3.5" aria-hidden />
              Create new guest
            </button>
          ) : null}
          {onSearchAgain ? (
            <button
              type="button"
              onClick={onSearchAgain}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Try another search
            </button>
          ) : null}
          {onScanAgain ? (
            <button
              type="button"
              onClick={onScanAgain}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Scan again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
