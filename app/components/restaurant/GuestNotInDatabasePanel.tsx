"use client";

import { SearchX, UserPlus, UserRound, Sparkles } from "lucide-react";

type GuestNotInDatabasePanelProps = {
  searchQuery?: string;
  onCreateGuest?: () => void;
  onSearchAgain?: () => void;
  onScanAgain?: () => void;
};

/**
 * Golootlo-inspired empty state when a guest is not saved in the database yet.
 * Shown to restaurant staff during scan / search — not the end customer.
 */
export function GuestNotInDatabasePanel({
  searchQuery,
  onCreateGuest,
  onSearchAgain,
  onScanAgain,
}: GuestNotInDatabasePanelProps) {
  const trimmedQuery = searchQuery?.trim();

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-200/70 bg-white shadow-lg shadow-amber-100/40 ring-1 ring-amber-100">
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 px-6 py-8 text-white sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 size-32 rounded-full bg-yellow-300/20 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-2 text-amber-100">
          <Sparkles className="size-4 shrink-0" aria-hidden />
          <p className="text-xs font-bold uppercase tracking-[0.2em]">
            Not in your database
          </p>
        </div>

        <h2 className="relative mt-3 max-w-lg text-2xl font-bold leading-tight sm:text-3xl">
          This guest hasn&apos;t been saved yet
        </h2>

        <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-amber-50/95 sm:text-base">
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
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4 text-center">
          <p className="text-2xl font-bold text-amber-700">New</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-800/70">
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
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm ring-1 ring-zinc-100">
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800"
            >
              <UserPlus className="size-4" aria-hidden />
              Create new guest
            </button>
          ) : null}
          {onSearchAgain ? (
            <button
              type="button"
              onClick={onSearchAgain}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Try another search
            </button>
          ) : null}
          {onScanAgain ? (
            <button
              type="button"
              onClick={onScanAgain}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Scan again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
