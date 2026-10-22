/**
 * What changed: Clearer Flow/Runs tabs, activate prominence, workflow identity chip.
 * Why: Enterprise builder top bar should show name, campaign, and live/draft status.
 * Related: AutomationBuilderPage portals, BusinessNavbar hosts.
 */

"use client";

import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { automationEase } from "@/app/lib/motion";

export type AutomationBuilderTab = "builder" | "runs";

const TABS: { id: AutomationBuilderTab; label: string }[] = [
  { id: "builder", label: "Flow" },
  { id: "runs", label: "Runs" },
];

export function AutomationBuilderIdentity({
  name,
  campaignName,
  isActive,
}: {
  name: string;
  campaignName?: string | null;
  isActive: boolean | null;
}) {
  const title = name.trim() || "Automation";
  const campaign = campaignName?.trim() || null;
  const statusKnown = isActive !== null;
  const live = isActive === true;

  return (
    <div className="automation-builder-topbar__identity hidden min-w-0 max-w-[14rem] items-center gap-2 sm:flex lg:max-w-[18rem]">
      <div className="min-w-0">
        <p
          className="m-0 truncate text-[0.8rem] font-bold tracking-tight text-[#07111f]"
          title={title}
        >
          {title}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          {campaign ? (
            <span
              className="truncate text-[0.62rem] font-medium text-zinc-500"
              title={campaign}
            >
              {campaign}
            </span>
          ) : null}
          {statusKnown ? (
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide ring-1 ${
                live
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200/80"
                  : "bg-amber-50 text-amber-800 ring-amber-200/80"
              }`}
            >
              {live ? "Active" : "Draft"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AutomationBuilderTabBar({
  tab,
  onTabChange,
}: {
  tab: AutomationBuilderTab;
  onTabChange: (next: AutomationBuilderTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Automation views"
      className="automation-builder-topbar__tabs relative grid w-max min-w-[9rem] grid-cols-2 rounded-full border border-zinc-200/80 bg-zinc-100/90 p-0.5 sm:min-w-[10.5rem] sm:p-1"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(t.id)}
            className={`relative z-10 cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight transition-colors duration-200 sm:px-5 sm:py-2 sm:text-sm ${
              active ? "" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="automation-builder-tab-pill"
                className="absolute inset-0 rounded-full bg-[#1877f2] shadow-[0_4px_12px_rgba(24,119,242,0.28)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <motion.span
              className={`relative block ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-800"
              }`}
              animate={{ scale: active ? 1.02 : 1 }}
              transition={{ duration: 0.2, ease: automationEase }}
            >
              {t.label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}

export function AutomationBuilderActivateButton({
  automationActive,
  activating,
  activateBlockedReason,
  onActivate,
  onDeactivate,
}: {
  automationActive: boolean | null;
  activating: boolean;
  activateBlockedReason?: string | null;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const statusKnown = automationActive !== null;
  const isActive = automationActive === true;
  const activateBlocked =
    !isActive && Boolean(activateBlockedReason?.trim());

  return (
    <div className="flex items-center gap-2">
      {statusKnown && isActive ? (
        <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[0.65rem] font-bold text-emerald-800 sm:inline-flex">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
          Live
        </span>
      ) : null}
      <button
        type="button"
        title={
          activateBlocked
            ? (activateBlockedReason ?? undefined)
            : isActive
              ? "Deactivate to edit this workflow"
              : undefined
        }
        onClick={() => void (isActive ? onDeactivate() : onActivate())}
        disabled={activating || !statusKnown || activateBlocked}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs ${
          !statusKnown
            ? "border border-zinc-200 bg-white text-zinc-500"
            : isActive
              ? "border border-[#1877f2]/30 bg-white text-[#1877f2] hover:bg-[#e8f2ff]"
              : activateBlocked
                ? "border border-zinc-200 bg-zinc-100 text-zinc-500"
                : "bg-[#1877f2] text-white hover:bg-[#166fe0] shadow-[0_6px_16px_rgba(24,119,242,0.28)]"
        }`}
      >
        {activating || !statusKnown ? (
          <Loader2
            className={`size-3.5 animate-spin ${
              isActive ? "text-[#1877f2]" : "text-zinc-400"
            }`}
            aria-hidden
          />
        ) : (
          <Zap
            className={`size-3.5 ${
              isActive
                ? "text-[#1877f2]"
                : activateBlocked
                  ? "text-zinc-500"
                  : "text-white"
            }`}
            aria-hidden
          />
        )}
        <span className="automation-builder-topbar__activate-label whitespace-nowrap">
          {!statusKnown
            ? "Loading…"
            : activating
              ? isActive
                ? "Deactivating…"
                : "Activating…"
              : isActive
                ? "Deactivate"
                : "Activate"}
        </span>
      </button>
    </div>
  );
}
