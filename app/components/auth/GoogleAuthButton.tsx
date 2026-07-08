"use client";

import { useState } from "react";
import {
  startGoogleAuth,
  type GoogleAuthMode,
} from "@/app/services/auth/start-google-auth";

type GoogleAuthButtonProps = {
  disabled?: boolean;
  label?: string;
  mode?: GoogleAuthMode;
};

/**
 * Continue with Google — redirects to Nest /api/auth/google?mode=login|signup.
 */
export default function GoogleAuthButton({
  disabled = false,
  label = "Continue with Google",
  mode = "login",
}: GoogleAuthButtonProps) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => {
        setBusy(true);
        startGoogleAuth(mode);
      }}
      className="inline-flex h-11 w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full border border-[#e8edf5] bg-white px-3 text-sm font-semibold text-brand-navy transition hover:bg-[#f8faff] disabled:opacity-50"
    >
      <svg
        aria-hidden
        width="18"
        height="18"
        viewBox="0 0 48 48"
        className="shrink-0"
      >
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.1 39.5 16 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l.1.1 6.2 5.2C39.2 37.3 44 32.5 44 24c0-1.3-.1-2.5-.4-3.5z"
        />
      </svg>
      {busy ? "Redirecting…" : label}
    </button>
  );
}
