"use client";

import { CircleDot, Loader2 } from "lucide-react";
import { executionStatusBadgeClass } from "@/app/components/automation/execution-status-ui";
import type { AutomationExecutionStatusDto } from "@/app/services/automation/types";

const ICON_STROKE = 2.25;

export function RunProgressBanner({
  status,
}: {
  status: AutomationExecutionStatusDto;
}) {
  const percent = Math.min(100, Math.max(0, status.progressPercent));
  const hasTotal = status.totalRecipients > 0;

  const title =
    status.status === "queued"
      ? "Queued"
      : status.status === "running"
        ? "Sending emails"
        : status.status === "waiting"
          ? "Waiting"
          : "In progress";

  const detail =
    status.status === "queued"
      ? "Your run will start in a moment."
      : status.status === "running" && hasTotal
        ? `${status.emailsSent} of ${status.totalRecipients} sent`
        : status.status === "waiting"
          ? "Paused until the next step is due."
          : "Working through this run…";

  return (
    <div
      className="mb-5 overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm ring-1 ring-violet-100/80"
      role="status"
      aria-live="polite"
    >
      <div className="bg-gradient-to-r from-violet-600/10 via-indigo-50/90 to-violet-50/50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
              {status.status === "queued" || status.status === "running" ? (
                <Loader2
                  className="size-5 animate-spin"
                  aria-hidden
                  strokeWidth={ICON_STROKE}
                />
              ) : (
                <CircleDot
                  className="size-5"
                  aria-hidden
                  strokeWidth={ICON_STROKE}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">{title}</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${executionStatusBadgeClass(status.status)}`}
                >
                  {status.status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-600">{detail}</p>
            </div>
          </div>
          {hasTotal ? (
            <p className="shrink-0 text-right text-2xl font-bold tabular-nums text-violet-700">
              {percent}
              <span className="text-sm font-semibold text-violet-500">%</span>
            </p>
          ) : null}
        </div>

        {hasTotal ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
              <span>Progress</span>
              <span className="tabular-nums text-zinc-700">
                {status.emailsSent} / {status.totalRecipients}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-[width] duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
