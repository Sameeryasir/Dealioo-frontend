"use client";

import { ProfileCompletionRing } from "@/app/components/business/business-profile/ProfileCompletionRing";
import { businessSettingsHref } from "@/app/lib/business-settings-routes";
import {
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const cardClass =
  "overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]";

type CompletionItem = {
  id: string;
  label: string;
  done: boolean;
};

type BusinessProfileSidePanelProps = {
  businessId: number;
  totalCampaigns: string;
  totalCustomers: string;
  activeAutomations: string;
  completionPercent: number;
  completionComplete: boolean;
  completionItems: CompletionItem[];
};

export function BusinessProfileSidePanel({
  businessId,
  totalCampaigns,
  totalCustomers,
  activeAutomations,
  completionPercent,
  completionComplete,
  completionItems,
}: BusinessProfileSidePanelProps) {
  return (
    <aside className="flex h-full min-h-full min-w-0 flex-col gap-5">
      <section className={`${cardClass} px-5 py-3 sm:px-5`}>
        <header className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1877f2]">
            <Zap className="size-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <h3 className="m-0 text-sm font-extrabold tracking-tight text-[#07111f]">
            Quick actions
          </h3>
        </header>
        <div className="mt-1.5 space-y-0.5">
          <ActionRow
            href={businessSettingsHref(businessId, "members")}
            title="Manage members"
          />
          <ActionRow
            href={businessSettingsHref(businessId, "integrations")}
            title="Integrations"
          />
        </div>
      </section>

      <section className={`${cardClass} px-5 py-3`}>
        <header className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1877f2]">
            <Sparkles className="size-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <h3 className="m-0 text-sm font-extrabold tracking-tight text-[#07111f]">
            Business summary
          </h3>
        </header>
        <div className="mt-1.5 space-y-0.5">
          <SummaryRow label="Total campaigns" value={totalCampaigns} />
          <SummaryRow label="Total customers" value={totalCustomers} />
          <SummaryRow label="Active automations" value={activeAutomations} />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#d7ede4] bg-[linear-gradient(145deg,#ffffff_0%,#f3fbf7_100%)] px-5 py-4 shadow-[0_14px_40px_rgba(14,24,43,0.06)]">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#09b66f]">
              <Check className="size-3.5" strokeWidth={2.75} aria-hidden />
            </span>
            <h3 className="m-0 text-base font-extrabold tracking-tight text-[#07111f]">
              Profile completion
            </h3>
          </div>
          {completionComplete ? (
            <span className="inline-flex shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              All set!
            </span>
          ) : null}
        </header>
        <div className="mt-4 flex items-center gap-4">
          <ProfileCompletionRing percent={completionPercent} size={72} />
          <ul className="m-0 flex min-w-0 flex-1 list-none flex-col gap-2 p-0">
            {completionItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span
                  className={`flex size-3.5 shrink-0 items-center justify-center rounded-full ${
                    item.done
                      ? "bg-[#09b66f] text-white"
                      : "bg-[#e2e8f0] text-transparent"
                  }`}
                  aria-hidden
                >
                  <Check className="size-2" strokeWidth={3} />
                </span>
                <span
                  className={`truncate text-[0.78rem] font-semibold ${
                    item.done ? "text-[#07111f]" : "text-[#94a3b8]"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </aside>
  );
}

function ActionRow({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-1 py-1.5 no-underline transition hover:bg-[#f8faff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1877f2]"
    >
      {Icon ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[#1877f2]">
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#07111f]">
        {title}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-slate-300"
        strokeWidth={2.25}
        aria-hidden
      />
    </Link>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-1 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#07111f]">
        {label}
      </span>
      <span className="shrink-0 text-sm font-bold text-[#07111f]">{value}</span>
    </div>
  );
}
