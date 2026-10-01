"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarClock,
  Check,
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
  eyebrow: string;
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
  accentBar: string;
} {
  switch (kind) {
    case "trigger":
      return {
        header: "bg-[#0f5ed7] text-white",
        iconWrap: "bg-white/20 text-white",
        Icon: Workflow,
        accentBar: "bg-[#0f5ed7]",
      };
    case "wait":
      return {
        header: "bg-[#eff6ff] text-[#0f5ed7]",
        iconWrap: "bg-[#1877f2] text-white",
        Icon: Clock,
        accentBar: "bg-[#1877f2]",
      };
    case "condition":
      return {
        header: "bg-orange-50 text-orange-900",
        iconWrap: "bg-orange-500 text-white",
        Icon: Filter,
        accentBar: "bg-orange-500",
      };
    case "sms":
      return {
        header: "bg-sky-50 text-sky-950",
        iconWrap: "bg-sky-600 text-white",
        Icon: MessageSquare,
        accentBar: "bg-sky-600",
      };
    default:
      return {
        header: "bg-[#eff6ff] text-[#0f5ed7]",
        iconWrap: "bg-[#1877f2] text-white",
        Icon: Mail,
        accentBar: "bg-[#1877f2]",
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
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.06 * index, duration: 0.28, ease: automationEase }}
      className="relative overflow-hidden rounded-2xl border border-[#dbe7f8] bg-white"
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${visual.accentBar}`}
        aria-hidden
      />
      <div
        className={`flex items-center gap-2.5 border-b border-[#eef2f7] px-3.5 py-2.5 text-[0.78rem] font-semibold ${visual.header}`}
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
    <div className="flex flex-col items-center py-0.5" aria-hidden>
      <span className="h-2 w-px bg-[#dbe7f8]" />
      <motion.span
        className="flex size-5 items-center justify-center rounded-full border border-[#dbe7f8] bg-white text-[#1877f2]"
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: automationEase }}
      >
        <ArrowRight className="size-3 rotate-90" strokeWidth={2.5} />
      </motion.span>
      <span className="h-2 w-px bg-[#dbe7f8]" />
    </div>
  );
}

function BuilderMap() {
  const parts = [
    {
      icon: PanelLeft,
      title: "Left",
      body: "Drag blocks onto the canvas",
      step: "01",
    },
    {
      icon: LayoutTemplate,
      title: "Center",
      body: "Arrange your live flow",
      step: "02",
    },
    {
      icon: PanelRight,
      title: "Right",
      body: "Edit each step’s settings",
      step: "03",
    },
  ] as const;

  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[#dbe7f8] bg-[#f8fbff] p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-x-8 top-[3.35rem] hidden h-px bg-[#dbe7f8] sm:block"
        aria-hidden
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {parts.map((part, index) => {
          const Icon = part.icon;
          return (
            <motion.div
              key={part.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.05 * index,
                duration: 0.26,
                ease: automationEase,
              }}
              className="relative rounded-2xl border border-white bg-white px-3.5 py-4 text-center"
            >
              <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-[#1877f2] text-white">
                <Icon className="size-[1.15rem]" strokeWidth={2.25} aria-hidden />
              </span>
              <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#1877f2]">
                {part.step}
              </p>
              <p className="m-0 mt-1.5 text-sm font-semibold text-[#07111f]">
                {part.title}
              </p>
              <p className="m-0 mt-1 text-xs leading-5 text-slate-500">
                {part.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function buildSteps(key: TriggerKey): GuideStep[] {
  const meta = triggerMeta(key);
  return [
    {
      id: "what",
      eyebrow: "Trigger",
      title: `How ${meta.label} works`,
      body: meta.whenItRuns,
    },
    {
      id: "format",
      eyebrow: "Canvas order",
      title: "How to start on the canvas",
      body: meta.startFormat,
      showNodeDemo: true,
    },
    {
      id: "builder",
      eyebrow: "Workspace",
      title: "Where everything lives",
      body: "Use the three panels together: drag from the left, arrange in the center, edit on the right.",
      showBuilderMap: true,
    },
    {
      id: "activate",
      eyebrow: "Go live",
      title: "Edit freely, then activate",
      body: "Change delays and messages anytime. Nothing runs for guests until you activate the automation.",
      showActivateTip: true,
    },
  ];
}

function StepProgress({
  steps,
  index,
}: {
  steps: GuideStep[];
  index: number;
}) {
  return (
    <div className="relative mt-6">
      <div
        className="absolute left-[0.7rem] right-[0.7rem] top-[0.7rem] hidden h-[2px] bg-[#e8edf5] sm:block"
        aria-hidden
      />
      <div
        className="absolute left-[0.7rem] top-[0.7rem] hidden h-[2px] bg-[#1877f2] sm:block"
        style={{
          width:
            steps.length <= 1
              ? "0%"
              : `calc(${(index / (steps.length - 1)) * 100}% - 0px)`,
          maxWidth: "calc(100% - 1.4rem)",
          transition: "width 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        aria-hidden
      />
      <ol className="relative m-0 grid list-none grid-cols-4 gap-2 p-0">
        {steps.map((item, stepIndex) => {
          const done = stepIndex < index;
          const active = stepIndex === index;
          return (
            <li key={item.id} className="min-w-0">
              <div className="flex flex-col items-start gap-2 sm:items-center sm:text-center">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-[0.65rem] font-bold transition ${
                    done || active
                      ? "bg-[#1877f2] text-white"
                      : "bg-[#eef2f7] text-slate-400"
                  }`}
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={2.75} aria-hidden />
                  ) : (
                    stepIndex + 1
                  )}
                </span>
                <span
                  className={`hidden max-w-full truncate text-[0.65rem] font-semibold uppercase tracking-[0.08em] sm:block ${
                    active ? "text-[#1877f2]" : "text-slate-400"
                  }`}
                >
                  {item.eyebrow}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
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
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: automationEase }}
        >
          <button
            type="button"
            aria-label="Skip guide"
            className="absolute inset-0 cursor-pointer bg-[#07111f]/55 backdrop-blur-[4px]"
            onClick={onSkip}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="automation-builder-guide-title"
            className="relative z-10 flex max-h-[min(94dvh,52rem)] w-full max-w-[40rem] flex-col overflow-hidden rounded-[1.5rem] border border-[#dbe7f8] bg-white"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.22, ease: automationEase }}
          >
            <div className="relative shrink-0 overflow-hidden border-b border-[#eef2f7] bg-white px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3.5">
                  <motion.span
                    className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#dbe7f8] bg-[#eff6ff] text-[#1877f2]"
                    initial={{ rotate: -8, scale: 0.92 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.28, ease: automationEase }}
                  >
                    <TriggerIcon
                      className="size-5"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </motion.span>
                  <div className="min-w-0 pt-0.5">
                    <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Builder guide · Step {index + 1} of {total}
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={step.id}
                        id="automation-builder-guide-title"
                        className="m-0 mt-1.5 text-[1.22rem] font-semibold tracking-tight text-[#07111f] sm:text-[1.35rem]"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: automationEase }}
                      >
                        {step.title}
                      </motion.h2>
                    </AnimatePresence>
                    {automationName?.trim() ? (
                      <p className="m-0 mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-[#e8edf5]">
                        <MousePointer2
                          className="size-3 shrink-0 text-[#1877f2]"
                          aria-hidden
                        />
                        <span className="truncate">{automationName.trim()}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Skip"
                  onClick={onSkip}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e8edf5] bg-white text-slate-500 transition hover:bg-[#f8fafc] hover:text-slate-800"
                >
                  <X className="size-4" strokeWidth={2.25} aria-hidden />
                </button>
              </div>

              <StepProgress steps={steps} index={index} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: automationEase }}
                  className="space-y-4"
                >
                  <p className="m-0 text-[0.98rem] leading-7 text-slate-600">
                    {step.body}
                  </p>

                  {step.showNodeDemo ? (
                    <div className="rounded-[1.35rem] border border-[#dbe7f8] bg-[#f8fbff] px-4 py-4 sm:px-5">
                      <div className="mb-3.5 flex items-center justify-between gap-2">
                        <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Example starting flow
                        </p>
                        <span className="rounded-full bg-[#1877f2] px-2.5 py-1 text-[0.65rem] font-semibold text-white">
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
                    <motion.div
                      className="relative overflow-hidden rounded-[1.35rem] border border-[#dbe7f8] bg-[#eff6ff] px-4 py-4 sm:px-5"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.28, ease: automationEase }}
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#1877f2] text-white">
                          <Play
                            className="size-4"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        </span>
                        <div>
                          <p className="m-0 text-sm font-semibold text-[#0f5ed7]">
                            Ready when you are
                          </p>
                          <p className="m-0 mt-1.5 text-sm leading-6 text-[#1d4ed8]/90">
                            Skip anytime. Keep editing later — guests only enter
                            after you activate.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}

                  {step.id === "what" ? (
                    <div className="flex items-start gap-2.5 rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] px-3.5 py-3 text-sm leading-6 text-slate-600">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-[#1877f2]"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span>
                        Next screens show the exact node order and where to
                        click in this builder.
                      </span>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eef2f7] bg-white px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={onSkip}
                className="h-11 cursor-pointer rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fafc] hover:text-slate-800"
              >
                Skip guide
              </button>
              <div className="flex items-center gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                    className="h-11 cursor-pointer rounded-xl border border-[#dbe7f8] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbff]"
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
                  className="inline-flex h-11 min-w-[8.25rem] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1877f2] px-5 text-sm font-semibold text-white transition hover:bg-[#0f5ed7]"
                >
                  {isLast ? "Got it" : "Continue"}
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
