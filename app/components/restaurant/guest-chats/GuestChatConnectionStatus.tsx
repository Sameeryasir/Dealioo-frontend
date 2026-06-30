"use client";

import type { PusherConnectionStatus } from "@/app/lib/pusher-client";

const STATUS_COPY: Record<
  PusherConnectionStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  live: {
    label: "Live",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  reconnecting: {
    label: "Reconnecting",
    dotClass: "bg-amber-400",
    textClass: "text-amber-700",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-zinc-400",
    textClass: "text-zinc-500",
  },
};

export function GuestChatConnectionStatus({
  status,
}: {
  status: PusherConnectionStatus;
}) {
  const copy = STATUS_COPY[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium ${copy.textClass}`}
      title={
        status === "live"
          ? "Realtime updates are connected."
          : status === "reconnecting"
            ? "Reconnecting to realtime updates."
            : "Realtime is offline. Chats sync in the background."
      }
    >
      <span className={`size-1.5 rounded-full ${copy.dotClass}`} aria-hidden />
      {copy.label}
    </span>
  );
}
