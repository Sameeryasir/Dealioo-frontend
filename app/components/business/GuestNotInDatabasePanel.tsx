"use client";

import { UserPlus, UserRound, X } from "lucide-react";

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
  const onDismiss = onSearchAgain ?? onScanAgain;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e182b]/45 p-4"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-not-found-title"
        className="relative w-full max-w-[24rem] rounded-[1.35rem] border border-[#e8edf5] bg-white px-6 pb-6 pt-5 text-center shadow-[0_24px_60px_rgba(14,24,43,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="absolute right-3.5 top-3.5 flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}

        <div className="relative mx-auto mt-2 flex size-[6.5rem] items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-[#eef5ff]"
            aria-hidden
          />
          <span
            className="absolute left-2 top-7 size-5 rounded-full bg-white/80"
            aria-hidden
          />
          <span
            className="absolute bottom-6 right-3 size-4 rounded-full bg-white/70"
            aria-hidden
          />
          <svg
            className="absolute inset-2 text-[#bfdbfe]"
            viewBox="0 0 88 88"
            fill="none"
            aria-hidden
          >
            <path
              d="M18 58C28 44 42 36 58 34"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeDasharray="3 3.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="relative flex size-12 items-center justify-center rounded-full bg-white text-[#1777f2] shadow-[0_8px_18px_rgba(23,119,242,0.16)] ring-1 ring-[#dbeafe]">
            <UserRound className="size-6" strokeWidth={2.05} aria-hidden />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#1777f2] text-white ring-2 ring-white">
              <X className="size-2.5" strokeWidth={3} aria-hidden />
            </span>
          </span>
        </div>

        <h2
          id="guest-not-found-title"
          className="mt-4 text-[1.35rem] font-extrabold tracking-tight text-[#0e182b]"
        >
          Guest not found
        </h2>

        <p className="mt-2 text-[0.9rem] font-medium leading-relaxed text-slate-500">
          {trimmedQuery ? (
            <>
              No guest matched{" "}
              <span className="font-bold text-[#0e182b]">
                &ldquo;{trimmedQuery}&rdquo;
              </span>
              .
            </>
          ) : (
            <>No matching guest was found.</>
          )}
        </p>

        <p className="mt-1.5 text-[0.78rem] font-medium text-slate-400">
          Try a different email, phone number, or create a new guest.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {onCreateGuest ? (
            <button
              type="button"
              onClick={onCreateGuest}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1777f2] px-3.5 py-2.5 text-[0.86rem] font-bold text-white shadow-[0_10px_22px_rgba(23,119,242,0.28)] transition hover:bg-[#1569e0]"
            >
              <UserPlus className="size-3.5" strokeWidth={2.25} aria-hidden />
              Create guest
            </button>
          ) : null}
          {onSearchAgain ? (
            <button
              type="button"
              onClick={onSearchAgain}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-[0.86rem] font-bold text-[#0e182b] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              Search again
            </button>
          ) : null}
          {onScanAgain ? (
            <button
              type="button"
              onClick={onScanAgain}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-[0.86rem] font-bold text-[#0e182b] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              Scan again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
