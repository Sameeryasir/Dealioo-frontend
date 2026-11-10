"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  adsCampaignSelectDotClass,
  adsCampaignsTable,
} from "@/app/components/campaign/ads-campaigns-table-styles";

export function AdsCampaignMobileList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2.5 md:hidden ${className}`}>{children}</div>
  );
}

export function AdsCampaignMobileCard({
  selected = false,
  onSelect,
  title,
  subtitle,
  media,
  status,
  metrics,
  actions,
}: {
  selected?: boolean;
  onSelect?: () => void;
  title: string;
  subtitle?: ReactNode;
  media?: ReactNode;
  status: ReactNode;
  metrics?: Array<{ label: string; value: string }>;
  actions?: ReactNode;
}) {
  return (
    <article
      className={`rounded-2xl border bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition ${
        selected
          ? "border-[#1877f2] ring-1 ring-[#1877f2]/30"
          : "border-[#e8edf5]"
      } ${onSelect ? "cursor-pointer" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <span
          className={`${adsCampaignSelectDotClass(selected)} mt-0.5 shrink-0`}
          aria-hidden={!selected}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
        {media}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-semibold text-[#07111f]">
                {title}
              </p>
              {subtitle ? (
                <div className="mt-0.5 min-w-0 text-[11px] text-slate-500">
                  {subtitle}
                </div>
              ) : null}
            </div>
            <div className="shrink-0">{status}</div>
          </div>
        </div>
      </div>

      {metrics && metrics.length > 0 ? (
        <dl className="mt-3 grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl bg-[#f8fafc] px-2.5 py-2"
            >
              <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {metric.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[#07111f]">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {actions ? (
        <div
          className="mt-3 flex items-center justify-end gap-1 border-t border-[#eef2f7] pt-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={adsCampaignsTable.actionRow}>{actions}</div>
        </div>
      ) : null}
    </article>
  );
}

export function AdsCampaignMobileEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#e8edf5] bg-[#f8fafc] px-4 py-8 text-center md:hidden">
      <div className="mx-auto flex justify-center text-slate-300">{icon}</div>
      <p className="mt-3 text-base font-bold text-[#07111f]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AdsCampaignMobileSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5 md:hidden" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[7.5rem] animate-pulse rounded-2xl border border-[#eef2f7] bg-[#f1f5f9]"
        />
      ))}
    </div>
  );
}
