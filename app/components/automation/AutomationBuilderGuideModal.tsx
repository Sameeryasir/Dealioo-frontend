"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  GitBranch,
  LayoutTemplate,
  Mail,
  MessageSquare,
  MousePointer2,
  PanelLeft,
  PanelRight,
  Play,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { automationEase } from "@/app/lib/motion";

type TriggerKey =
  | "abandoned_checkout"
  | "first_purchase"
  | "funnel_complete"
  | "win_back"
  | "payment"
  | "signup"
  | "cron"
  | "generic";

type DemoNodeKind = "trigger" | "wait" | "condition" | "email" | "sms";

type GuideStep = {
  id: string;
  title: string;
  body: string;
  showNodeDemo?: boolean;
  showBuilderMap?: boolean;
  showActivateTip?: boolean;
};

function resolveTriggerKey(raw?: string | null): TriggerKey {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (
    value === "abandoned_checkout" ||
    value === "abandoned-checkout" ||
    value.includes("abandoned")
  ) {
    return "abandoned_checkout";
  }
  if (value === "first_purchase" || value.includes("first_purchase")) {
    return "first_purchase";
  }
  if (
    value === "funnel_complete" ||
    value === "funnel_completed" ||
    value.includes("funnel_complete")
  ) {
    return "funnel_complete";
  }
  if (
    value === "win_back" ||
    value === "win-back" ||
    value === "no_visit" ||
    value.includes("win")
  ) {
    return "win_back";
  }
  if (value === "payment") return "payment";
  if (value === "signup") return "signup";
  if (value === "cron" || value === "cron_job") return "cron";
  return "generic";
}

function triggerMeta(key: TriggerKey): {
  icon: LucideIcon;
  label: string;
  whenItRuns: string;
  startFormat: string;
  demoNodes: Array<{ kind: DemoNodeKind; title: string; body: string }>;
} {
  switch (key) {
    case "abandoned_checkout":
      return {
        icon: ShoppingCart,
        label: "Abandoned Checkout",
        whenItRuns:
          "Starts when a guest signs up / starts checkout. Your Wait + Still unpaid steps decide when to message them.",
        startFormat:
          "Use this order on the canvas: trigger first, then wait, then unpaid check, then your message.",
        demoNodes: [
          {
            kind: "trigger",
            title: "Abandoned checkout",
            body: "Guest started checkout",
          },
          { kind: "wait", title: "Wait", body: "1 hour" },
          {
            kind: "condition",
            title: "Still unpaid?",
            body: "Continue only if unpaid",
          },
          {
            kind: "sms",
            title: "Recovery SMS",
            body: "Come finish checkout",
          },
        ],
      };
    case "first_purchase":
      return {
        icon: Sparkles,
        label: "First Purchase",
        whenItRuns:
          "Starts only on a guest’s first paid purchase for this funnel — not repeat buys.",
        startFormat:
          "Start with First purchase, add a short Wait, then welcome email or SMS.",
        demoNodes: [
          {
            kind: "trigger",
            title: "First purchase",
            body: "First paid purchase",
          },
          { kind: "wait", title: "Wait", body: "10 minutes" },
          {
            kind: "email",
            title: "Welcome email",
            body: "Thanks for buying",
          },
        ],
      };
    case "funnel_complete":
      return {
        icon: GitBranch,
        label: "Funnel Complete",
        whenItRuns:
          "Starts when a guest finishes the funnel path (signup or paid).",
        startFormat:
          "Start with Funnel completed, wait a bit, then thank-you and optional review ask.",
        demoNodes: [
          {
            kind: "trigger",
            title: "Funnel completed",
            body: "Guest finished funnel",
          },
          { kind: "wait", title: "Wait", body: "30 minutes" },
          {
            kind: "email",
            title: "Thank-you email",
            body: "You’re all set",
          },
        ],
      };
    case "win_back":
      return {
        icon: RotateCcw,
        label: "Win-back",
        whenItRuns:
          "Runs on a schedule for guests inactive for your chosen number of days.",
        startFormat:
          "Set inactive days on Win-back, then tag + return email/SMS.",
        demoNodes: [
          {
            kind: "trigger",
            title: "Win-back",
            body: "No visit for 30 days",
          },
          {
            kind: "email",
            title: "Return email",
            body: "We miss you",
          },
          {
            kind: "sms",
            title: "Return SMS",
            body: "Come back anytime",
          },
        ],
      };
    case "payment":
      return {
        icon: CreditCard,
        label: "Payment",
        whenItRuns: "Starts when payment is completed for this funnel.",
        startFormat:
          "Start with Payment, optional Wait, then thank-you / pass follow-up.",
        demoNodes: [
          { kind: "trigger", title: "Payment", body: "Payment completed" },
          { kind: "wait", title: "Wait", body: "Optional delay" },
          {
            kind: "email",
            title: "Thank-you email",
            body: "Pass / follow-up",
          },
        ],
      };
    case "cron":
      return {
        icon: CalendarClock,
        label: "Cron Job",
        whenItRuns: "Runs on the schedule you set, then continues the flow.",
        startFormat: "Start with Cron, add a filter, then reminder email/SMS.",
        demoNodes: [
          { kind: "trigger", title: "Cron Job", body: "Every day at 9:00" },
          {
            kind: "condition",
            title: "Filter",
            body: "Unpaid guests",
          },
          {
            kind: "email",
            title: "Reminder email",
            body: "Complete payment",
          },
        ],
      };
    case "signup":
      return {
        icon: UserPlus,
        label: "Signup",
        whenItRuns: "Starts when a guest signs up on this campaign funnel.",
        startFormat:
          "Start with Signup, optional Wait, then welcome SMS/email.",
        demoNodes: [
          { kind: "trigger", title: "Signup", body: "New guest signup" },
          { kind: "wait", title: "Wait", body: "Optional delay" },
          {
            kind: "sms",
            title: "Welcome SMS",
            body: "Thanks for joining",
          },
        ],
      };
    default:
      return {
        icon: Workflow,
        label: "Automation",
        whenItRuns: "Starts based on the trigger at the top of your flow.",
        startFormat: "Start with a trigger, then waits/conditions, then actions.",
        demoNodes: [
          { kind: "trigger", title: "Trigger", body: "Start of the flow" },
          { kind: "wait", title: "Wait", body: "Optional delay" },
          { kind: "email", title: "Action", body: "Email or SMS" },
        ],
      };
  }
}

function nodeVisual(kind: DemoNodeKind): {
  header: string;
  iconWrap: string;
  Icon: LucideIcon;
} {
  switch (kind) {
    case "trigger":
      return {
        header:
          "border-white/10 bg-[linear-gradient(180deg,#0e2238_0%,#16385a_100%)] text-white",
        iconWrap: "bg-white/15 text-white",
        Icon: Workflow,
      };
    case "wait":
      return {
        header: "border-blue-100 bg-blue-50 text-blue-950",
        iconWrap: "bg-[#1877f2] text-white",
        Icon: Clock,
      };
    case "condition":
      return {
        header: "border-amber-100 bg-amber-50 text-amber-950",
        iconWrap: "bg-amber-500 text-white",
        Icon: Filter,
      };
    case "sms":
      return {
        header: "border-violet-100 bg-violet-50 text-violet-950",
        iconWrap: "bg-violet-500 text-white",
        Icon: MessageSquare,
      };
    default:
      return {
        header: "border-sky-100 bg-sky-50 text-sky-950",
        iconWrap: "bg-sky-500 text-white",
        Icon: Mail,
      };
  }
}

function NodeDemoCard({
  kind,
  title,
  body,
  triggerIcon: TriggerIcon,
  index,
}: {
  kind: DemoNodeKind;
  title: string;
  body: string;
  triggerIcon: LucideIcon;
  index: number;
}) {
  const visual = nodeVisual(kind);
  const Icon = kind === "trigger" ? TriggerIcon : visual.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.22, ease: automationEase }}
      className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
    >
      <div
        className={`flex items-center gap-2.5 border-b px-3.5 py-2.5 text-[0.78rem] font-semibold ${visual.header}`}
      >
        <span
          className={`flex size-6 items-center justify-center rounded-lg ${visual.iconWrap}`}
        >
          <Icon className="size-3.5" strokeWidth={2.35} aria-hidden />
        </span>
        {title}
      </div>
      <p className="m-0 px-3.5 py-3 text-[0.8rem] leading-5 text-slate-600">
        {body}
      </p>
    </motion.div>
  );
}

function FlowConnector() {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <span className="h-2.5 w-px bg-slate-200" />
      <span className="flex size-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
        <ArrowRight className="size-3 rotate-90" strokeWidth={2.5} />
      </span>
      <span className="h-2.5 w-px bg-slate-200" />
    </div>
  );
}

function BuilderMap() {
  const parts = [
    {
      icon: PanelLeft,
      title: "Left",
      body: "Blocks to drag",
      tone: "bg-[#eff6ff] text-[#1877f2]",
    },
    {
      icon: LayoutTemplate,
      title: "Center",
      body: "Your live flow",
      tone: "bg-[#ecfdf5] text-[#059669]",
    },
    {
      icon: PanelRight,
      title: "Right",
      body: "Step settings",
      tone: "bg-[#fff7ed] text-[#ea580c]",
    },
  ] as const;

  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {parts.map((part, index) => {
        const Icon = part.icon;
        return (
          <motion.div
            key={part.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.04 * index,
              duration: 0.22,
              ease: automationEase,
            }}
            className="rounded-2xl border border-[#e8edf5] bg-white px-3.5 py-3.5 shadow-sm"
          >
            <span
              className={`mb-2.5 flex size-8 items-center justify-center rounded-xl ${part.tone}`}
            >
              <Icon className="size-4" strokeWidth={2.25} aria-hidden />
            </span>
            <p className="m-0 text-sm font-semibold text-[#07111f]">
              {part.title}
            </p>
            <p className="m-0 mt-1 text-xs leading-5 text-slate-500">
              {part.body}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

function buildSteps(key: TriggerKey): GuideStep[] {
  const meta = triggerMeta(key);
  return [
    {
      id: "what",
      title: `How ${meta.label} works`,
      body: meta.whenItRuns,
    },
    {
      id: "format",
      title: "How to start on the canvas",
      body: meta.startFormat,
      showNodeDemo: true,
    },
    {
      id: "builder",
      title: "Where everything lives",
      body: "Use the three panels together: drag from the left, arrange in the center, edit on the right.",
      showBuilderMap: true,
    },
    {
      id: "activate",
      title: "Edit freely, then activate",
      body: "Change delays and messages anytime. Nothing runs for guests until you activate the automation.",
      showActivateTip: true,
    },
  ];
}

export function AutomationBuilderGuideModal({
  open,
  trigger,
  automationName,
  onSkip,
  onFinished,
}: {
  open: boolean;
  trigger?: string | null;
  automationName?: string | null;
  onSkip: () => void;
  onFinished: () => void;
}) {
  const key = resolveTriggerKey(trigger);
  const meta = useMemo(() => triggerMeta(key), [key]);
  const steps = useMemo(() => buildSteps(key), [key]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, key]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSkip();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        if (index >= steps.length - 1) onFinished();
        else setIndex((prev) => Math.min(steps.length - 1, prev + 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((prev) => Math.max(0, prev - 1));
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, index, steps.length, onSkip, onFinished]);

  if (!open) return null;

  const step = steps[index] ?? steps[0]!;
  const isLast = index >= steps.length - 1;
  const TriggerIcon = meta.icon;
  const total = steps.length;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: automationEase }}
        >
          <button
            type="button"
            aria-label="Skip guide"
            className="absolute inset-0 cursor-pointer bg-zinc-950/50 backdrop-blur-[3px]"
            onClick={onSkip}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="automation-builder-guide-title"
            className="relative z-10 flex max-h-[min(92dvh,48rem)] w-full max-w-[38rem] flex-col overflow-hidden rounded-[1.35rem] border border-[#e8edf5] bg-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: automationEase }}
          >
            <div className="relative shrink-0 overflow-hidden border-b border-[#eef2f7] bg-[#eff6ff] px-6 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
              <div
                className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/50 blur-2xl"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)]">
                    <TriggerIcon
                      className="size-5"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Builder guide · {index + 1}/{total}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={step.id}
                        id="automation-builder-guide-title"
                        className="m-0 mt-1.5 text-[1.2rem] font-semibold tracking-tight text-[#07111f] sm:text-[1.28rem]"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: automationEase }}
                      >
                        {step.title}
                      </motion.h2>
                    </AnimatePresence>
                    {automationName?.trim() ? (
                      <p className="m-0 mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-black/[0.04]">
                        <MousePointer2 className="size-3 shrink-0 text-[#1877f2]" />
                        <span className="truncate">{automationName.trim()}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Skip"
                  onClick={onSkip}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/70 bg-white/80 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800"
                >
                  <X className="size-4" strokeWidth={2.25} aria-hidden />
                </button>
              </div>

              <div className="relative mt-5 flex gap-2">
                {steps.map((item, stepIndex) => (
                  <div
                    key={item.id}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70"
                  >
                    <motion.div
                      className="h-full rounded-full bg-[#1877f2]"
                      initial={false}
                      animate={{
                        width: stepIndex <= index ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.25, ease: automationEase }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7 sm:py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: automationEase }}
                  className="space-y-4"
                >
                  <p className="m-0 text-[0.95rem] leading-7 text-slate-600">
                    {step.body}
                  </p>

                  {step.showNodeDemo ? (
                    <div className="rounded-[1.25rem] border border-[#e8edf5] bg-[#f8fafc] px-4 py-4 sm:px-5">
                      <div className="mb-3.5 flex items-center justify-between gap-2">
                        <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Example starting flow
                        </p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[0.65rem] font-semibold text-[#1877f2] ring-1 ring-[#dbe7f8]">
                          Match this order
                        </span>
                      </div>
                      <div className="mx-auto flex max-w-[22rem] flex-col">
                        {meta.demoNodes.map((node, nodeIndex) => (
                          <div key={`${node.title}-${nodeIndex}`}>
                            <NodeDemoCard
                              kind={node.kind}
                              title={node.title}
                              body={node.body}
                              triggerIcon={TriggerIcon}
                              index={nodeIndex}
                            />
                            {nodeIndex < meta.demoNodes.length - 1 ? (
                              <FlowConnector />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step.showBuilderMap ? <BuilderMap /> : null}

                  {step.showActivateTip ? (
                    <div className="flex items-start gap-3 rounded-[1.25rem] border border-[#dbe7f8] bg-[#eff6ff] px-4 py-3.5">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white">
                        <Play className="size-3.5" strokeWidth={2.5} aria-hidden />
                      </span>
                      <div>
                        <p className="m-0 text-sm font-semibold text-[#0f5ed7]">
                          Ready when you are
                        </p>
                        <p className="m-0 mt-1 text-sm leading-6 text-[#1d4ed8]/90">
                          Skip anytime. Come back later and keep editing —
                          guests only enter after you activate.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {step.id === "what" ? (
                    <div className="flex items-start gap-2.5 rounded-2xl border border-[#e8edf5] bg-[#f8fafc] px-3.5 py-3 text-sm leading-6 text-slate-600">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-[#34a853]"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span>
                        Next screens show the exact node order and where to
                        click on this builder.
                      </span>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eef2f7] bg-[#fafbfc] px-6 py-4 sm:px-7">
              <button
                type="button"
                onClick={onSkip}
                className="h-10 cursor-pointer rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                    className="h-10 cursor-pointer rounded-xl border border-[#e8edf5] bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (isLast) {
                      onFinished();
                      return;
                    }
                    setIndex((prev) => Math.min(steps.length - 1, prev + 1));
                  }}
                  className="inline-flex h-10 min-w-[7.5rem] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1877f2] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5]"
                >
                  {isLast ? "Got it" : "Next"}
                  {!isLast ? (
                    <ArrowRight
                      className="size-3.5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    <CheckCircle2
                      className="size-3.5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
