"use client";

import { Loader2, Pause, Play } from "lucide-react";

export function PauseAutomationButton({
  busy,
  isActive,
  onClick,
}: {
  busy?: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const label = busy
    ? isActive
      ? "Pausing…"
      : "Resuming…"
    : isActive
      ? "Pause automation"
      : "Resume automation";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : isActive ? (
        <Pause className="size-4" aria-hidden />
      ) : (
        <Play className="size-4" aria-hidden />
      )}
      {label}
    </button>
  );
}
