"use client";

import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { automationEase } from "@/app/lib/motion";

export type AutomationBuilderTab = "builder" | "runs";

const TABS: { id: AutomationBuilderTab; label: string }[] = [
  { id: "builder", label: "Flow" },
  { id: "runs", label: "Runs" },
];

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
      className="automation-builder-topbar__tabs relative grid w-max min-w-[9rem] grid-cols-2 rounded-full border border-zinc-200/80 bg-zinc-100/80 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-zinc-950/[0.05] sm:min-w-[10.5rem] sm:p-1"
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
                className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-primary via-brand-primary to-brand-primary-hover shadow-[0_4px_14px_rgba(24,119,242,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-brand-primary/25"
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
  onActivate,
  onDeactivate,
}: {
  automationActive: boolean;
  activating: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => void (automationActive ? onDeactivate() : onActivate())}
      disabled={activating}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs ${
        automationActive
          ? "border border-brand-primary/30 bg-white text-brand-primary hover:bg-[#e8f2ff]"
          : "bg-brand-primary text-white hover:bg-brand-primary-hover"
      }`}
    >
      {activating ? (
        <Loader2
          className={`size-3.5 animate-spin ${automationActive ? "text-brand-primary" : "text-white"}`}
          aria-hidden
        />
      ) : (
        <Zap
          className={`size-3.5 ${automationActive ? "text-brand-primary" : "text-white"}`}
          aria-hidden
        />
      )}
      <span className="automation-builder-topbar__activate-label whitespace-nowrap">
        {activating
          ? automationActive
            ? "Deactivating…"
            : "Activating…"
          : automationActive
            ? "Deactivate"
            : "Activate"}
      </span>
    </button>
  );
}
