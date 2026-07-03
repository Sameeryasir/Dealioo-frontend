"use client";

import { Clock3 } from "lucide-react";
import Link from "next/link";
import { panelCardClass } from "@/app/lib/panel-styles";

export function ComingSoonPanel({
  title,
  description = "This section is not available yet. We are building it now.",
  backHref,
  backLabel = "Go back",
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[min(70vh,640px)] w-full max-w-lg items-center px-4 py-10 sm:px-6">
      <div
        className={`w-full px-6 py-14 text-center sm:px-10 ${panelCardClass}`}
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <Clock3 className="size-7" aria-hidden strokeWidth={2.25} />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">
          Coming soon
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
        {backHref ? (
          <Link
            href={backHref}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
