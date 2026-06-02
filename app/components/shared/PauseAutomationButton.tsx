"use client";

import { Loader2, Pause, Play } from "lucide-react";
import { primaryButtonMdClass } from "@/app/lib/panel-styles";

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
      className={primaryButtonMdClass}
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
