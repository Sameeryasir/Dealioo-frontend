"use client";

import { useEffect } from "react";
import { FACEBOOK_OAUTH_CANCELLED_MESSAGE } from "@/app/lib/facebook-oauth-popup";

/**
 * Not now — notify opener, close popup, no cancel UI.
 * If the browser blocks close, leave a blank page (opener already has Dealioo).
 */
export function FacebookOAuthCancelledPanel() {
  useEffect(() => {
    window.opener?.postMessage(
      { type: FACEBOOK_OAUTH_CANCELLED_MESSAGE },
      "*",
    );
    try {
      window.opener?.focus();
    } catch {
      /* ignore */
    }
    window.close();
  }, []);

  // No "Connection cancelled" / "Back to Dealioo" screen.
  return (
    <main className="min-h-dvh bg-zinc-50" aria-hidden />
  );
}
