"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

export function PrivacyPolicyUrlBanner({
  privacyUrl,
}: {
  privacyUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(privacyUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [privacyUrl]);

  return (
    <section
      className="rounded-2xl border border-[#1877F2]/25 bg-gradient-to-br from-[#1877F2]/8 via-white to-white p-5 shadow-sm sm:p-6"
      aria-label="Meta privacy policy URL"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1877F2]">
        Meta Developer Console
      </p>
      <h2 className="mt-1 text-base font-semibold text-zinc-900 sm:text-lg">
        Privacy Policy URL (ngrok)
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Paste this URL into your Meta app under{" "}
        <strong className="font-medium text-zinc-800">Settings → Basic → Privacy Policy URL</strong>.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code
          className="block flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-800 sm:text-sm"
        >
          {privacyUrl}
        </code>
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#166FE0] active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="size-4" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" aria-hidden />
              Copy URL
            </>
          )}
        </button>
      </div>
    </section>
  );
}
