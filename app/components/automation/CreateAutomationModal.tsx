"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  ArrowLeft,
  ChevronRight,
  CalendarClock,
  Clock,
  CreditCard,
  Download,
  GitBranch,
  Mail,
  MessageSquare,
  Percent,
  Plus,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Type,
  UserPlus,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, createElement, type ReactNode } from "react";
import {
  AUTOMATION_TEMPLATES,
  getAutomationTemplateById,
  type AutomationTemplateNodeDef,
} from "@/app/components/automation/automation-templates";
import { flowPreviewHeaderClass } from "@/app/components/automation/builder/flow-step-colors";
import { automationEase } from "@/app/lib/motion";
import { resolvePurposeMetaForTrigger } from "@/app/services/automation/automation-create-context";
import { purposeToUi } from "@/app/services/automation/automation-api";
import {
  CRON_AUTOMATION_PURPOSE_OPTIONS,
  type AutomationPurpose,
} from "@/app/services/automation/types";
import { isCronTrigger } from "@/app/services/automation/automation-purpose";

const TRIGGERS = [
  "Cron Job",
  "Payment",
  "Signup",
  "Abandoned Checkout",
  "First Purchase",
  "Funnel Complete",
  "Win-back",
] as const;
type CreateTriggerOption = (typeof TRIGGERS)[number];

type ModalStep = "choose" | "import-list" | "import-preview" | "create-blank";

const ICON_STROKE = 2.5;
const fieldInputClass =
  "h-11 w-full rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1877f2]/25";
const fieldTextareaClass =
  "w-full resize-none rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1877f2]/25";

function FieldLabel({
  icon: Icon,
  children,
  iconClassName = "text-[#1877f2]",
}: {
  icon: LucideIcon;
  children: ReactNode;
  iconClassName?: string;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
      <Icon
        className={`size-3.5 shrink-0 ${iconClassName}`}
        aria-hidden
        strokeWidth={ICON_STROKE}
      />
      {children}
    </label>
  );
}

function RadioOptionGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  accent = "blue",
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  accent?: "blue" | "amber" | "orange";
}) {
  const accentClass =
    accent === "amber"
      ? "accent-amber-600"
      : accent === "orange"
        ? "accent-orange-600"
        : "accent-blue-600";

  return (
    <div className="space-y-2 pl-0.5 sm:space-y-2.5" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-700"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className={`mt-0.5 size-4 shrink-0 ${accentClass}`}
            />
            <span
              className={`min-w-0 leading-snug ${selected ? "font-semibold text-zinc-900" : ""}`}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function templateListVisual(templateId: string): {
  icon: LucideIcon;
  accentClass: string;
} {
  if (templateId === "abandoned_checkout" || templateId === "abandoned_cart") {
    return {
      icon: ShoppingCart,
      accentClass: "bg-gradient-to-br from-[#f59e0b] to-[#ea580c] shadow-orange-500/25",
    };
  }
  if (templateId === "first_purchase") {
    return {
      icon: Sparkles,
      accentClass: "bg-gradient-to-br from-[#34d399] to-[#059669] shadow-emerald-500/25",
    };
  }
  if (templateId === "funnel_complete") {
    return {
      icon: GitBranch,
      accentClass: "bg-gradient-to-br from-[#818cf8] to-[#4f46e5] shadow-indigo-500/25",
    };
  }
  if (templateId === "win_back") {
    return {
      icon: RotateCcw,
      accentClass: "bg-gradient-to-br from-[#fb7185] to-[#e11d48] shadow-rose-500/25",
    };
  }
  if (templateId === "payment_reminder") {
    return {
      icon: CreditCard,
      accentClass: "bg-gradient-to-br from-[#1877f2] to-[#0f5ed7] shadow-[#1877f2]/25",
    };
  }
  if (templateId === "post_payment_journey") {
    return {
      icon: CreditCard,
      accentClass: "bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/25",
    };
  }
  if (templateId === "signup_automation") {
    return {
      icon: UserPlus,
      accentClass: "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/25",
    };
  }
  return {
    icon: ShoppingCart,
    accentClass: "bg-gradient-to-br from-[#3b82f6] to-[#1877f2] shadow-[#1877f2]/25",
  };
}

function templateNodeIcon(kind: AutomationTemplateNodeDef["kind"]): LucideIcon {
  switch (kind) {
    case "payment_trigger":
      return CreditCard;
    case "signup_trigger":
      return UserPlus;
    case "abandoned_checkout_trigger":
      return ShoppingCart;
    case "first_purchase_trigger":
      return Sparkles;
    case "funnel_complete":
      return GitBranch;
    case "win_back_trigger":
      return RotateCcw;
    case "cron_trigger":
      return CalendarClock;
    case "wait":
      return Clock;
    case "condition":
      return GitBranch;
    case "send_sms":
      return MessageSquare;
    case "send_email":
      return Mail;
    case "create_coupon":
      return Percent;
    case "tag_customer":
      return Tag;
    case "reviews":
      return Star;
    default:
      return Workflow;
  }
}

function templateNodeTone(kind: AutomationTemplateNodeDef["kind"]): string {
  switch (kind) {
    case "signup_trigger":
    case "payment_trigger":
    case "abandoned_checkout_trigger":
    case "first_purchase_trigger":
    case "funnel_complete":
    case "win_back_trigger":
      return flowPreviewHeaderClass("signup_trigger");
    case "cron_trigger":
      return flowPreviewHeaderClass("cron_trigger");
    case "wait":
      return flowPreviewHeaderClass("wait");
    case "condition":
      return flowPreviewHeaderClass("condition");
    default:
      return flowPreviewHeaderClass("default");
  }
}

function TemplateNodePreview({ node }: { node: AutomationTemplateNodeDef }) {
  const icon = templateNodeIcon(node.kind);
  const tone = templateNodeTone(node.kind);

  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
      <div className={`border-b px-3 py-2 text-xs font-semibold ${tone}`}>
        {node.label}
      </div>
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        {createElement(icon, {
          className: "mt-0.5 size-4 shrink-0 text-zinc-500",
          strokeWidth: ICON_STROKE,
          "aria-hidden": true,
        })}
        <p className="text-sm leading-relaxed text-zinc-700">{node.summary}</p>
      </div>
    </li>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  onClick,
  accentClass,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  accentClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="create-automation-choice-card group flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
    >
      <span
        className={`create-automation-choice-card__icon flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${accentClass}`}
      >
        <Icon className="size-5" strokeWidth={ICON_STROKE} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="create-automation-choice-card__title text-sm font-semibold text-zinc-900">
            {title}
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-600"
            aria-hidden
          />
        </span>
        <span className="create-automation-choice-card__desc mt-1 block text-sm leading-relaxed text-zinc-500">
          {description}
        </span>
      </span>
    </button>
  );
}

export function CreateAutomationModal({
  open,
  onClose,
  onCreate,
  isSubmitting = false,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string;
    trigger: string;
    purpose: AutomationPurpose;
    templateId?: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <CreateAutomationModalBody
          onClose={onClose}
          onCreate={onCreate}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </AnimatePresence>
  );
}

function CreateAutomationModalBody({
  onClose,
  onCreate,
  isSubmitting = false,
}: {
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string;
    trigger: string;
    purpose: AutomationPurpose;
    templateId?: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const [step, setStep] = useState<ModalStep>("choose");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<CreateTriggerOption>(TRIGGERS[0]);
  const [purpose, setPurpose] = useState<AutomationPurpose>(
    () => resolvePurposeMetaForTrigger(TRIGGERS[0]).purpose,
  );
  const purposeMeta = resolvePurposeMetaForTrigger(trigger);
  const cronAllowsPurposeChoice = isCronTrigger(trigger);

  const selectedTemplate = selectedTemplateId
    ? getAutomationTemplateById(selectedTemplateId)
    : undefined;

  const handleTriggerChange = (next: CreateTriggerOption) => {
    setTrigger(next);
    if (!isCronTrigger(next)) {
      setPurpose(resolvePurposeMetaForTrigger(next).purpose);
      return;
    }
    setPurpose(
      CRON_AUTOMATION_PURPOSE_OPTIONS[0]?.value ??
        "funnel_signup_payment_reminder",
    );
  };

  const goBack = () => {
    if (step === "import-preview") {
      setStep("import-list");
      return;
    }
    if (step === "import-list" || step === "create-blank") {
      setStep("choose");
    }
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate || isSubmitting) return;
    void onCreate({
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      trigger: selectedTemplate.trigger,
      purpose: selectedTemplate.purpose,
      templateId: selectedTemplate.id,
    });
  };

  const modalTitle =
    step === "choose"
      ? "Add automation"
      : step === "import-list"
        ? "Import template"
        : step === "import-preview"
          ? selectedTemplate?.name ?? "Template preview"
          : "Create automation";

  const modalSubtitle =
    step === "choose"
      ? "Import a ready-made workflow or build your own from scratch."
      : step === "import-list"
        ? "Pick a template to pre-fill your automation steps."
        : step === "import-preview"
          ? "Review the workflow steps before opening the builder."
          : "Name your workflow, choose a trigger, and pick what this automation is for.";

  return (
        <motion.div
          className="create-automation-modal-overlay fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <button
            type="button"
            className="fixed inset-0 cursor-pointer bg-zinc-950/40 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={onClose}
          />
          <div className="create-automation-modal-wrap flex min-h-dvh items-center justify-center sm:min-h-[calc(100dvh-2rem)]">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-automation-title"
              className="create-automation-modal relative z-10 flex w-full max-w-lg flex-col overflow-hidden border border-zinc-200/90 bg-white shadow-2xl ring-1 ring-zinc-950/5"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: automationEase }}
            >
              <div className="create-automation-modal__header flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex min-w-0 items-start gap-3">
                  {step !== "choose" ? (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={isSubmitting}
                      aria-label="Go back"
                      className="mt-0.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowLeft className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
                    </button>
                  ) : (
                    <span
                      className="create-automation-modal__brand-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1877f2] to-[#0f5ed7] text-white shadow-md shadow-[#1877f2]/25 sm:size-10"
                      aria-hidden
                    >
                      <Workflow className="size-4 sm:size-5" strokeWidth={ICON_STROKE} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2
                      id="create-automation-title"
                      className="create-automation-modal__title text-base font-bold tracking-tight text-zinc-900 sm:text-lg"
                    >
                      {modalTitle}
                    </h2>
                    <p className="create-automation-modal__subtitle mt-1 text-xs text-zinc-500 sm:text-sm">
                      {modalSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="create-automation-modal__close flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#1877f2] bg-[#1877f2] text-white shadow-sm transition hover:border-[#0f5ed7] hover:bg-[#0f5ed7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/30 sm:size-9"
                >
                  <X className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
                </button>
              </div>

              {step === "choose" ? (
                <div className="create-automation-modal__body min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                  <ChoiceCard
                    icon={Download}
                    title="Import template"
                    description="Start from a proven template — Payment Reminder, Prepaid Offer, or Signup automation."
                    accentClass="bg-gradient-to-br from-sky-500 to-[#1877f2] shadow-[#1877f2]/25"
                    onClick={() => setStep("import-list")}
                  />
                  <ChoiceCard
                    icon={Sparkles}
                    title="Create from scratch"
                    description="Build a custom automation and add your own triggers, waits, and actions."
                    accentClass="bg-gradient-to-br from-[#1877f2] to-[#0f5ed7] shadow-[#1877f2]/25"
                    onClick={() => setStep("create-blank")}
                  />
                </div>
              ) : null}

              {step === "import-list" ? (
                <div className="create-automation-modal__body create-automation-template-list min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                  <div className="create-automation-template-list__items">
                    {AUTOMATION_TEMPLATES.map((template) => {
                      const visual = templateListVisual(template.id);
                      return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setStep("import-preview");
                        }}
                        className="create-automation-template-card group flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/25"
                      >
                        <span
                          className={`create-automation-template-card__icon flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${visual.accentClass}`}
                        >
                          {createElement(visual.icon, {
                            className: "size-5",
                            strokeWidth: ICON_STROKE,
                          })}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="create-automation-template-card__heading flex flex-wrap items-center gap-2">
                            <span className="create-automation-template-card__title text-sm font-semibold text-zinc-900">
                              {template.name}
                            </span>
                            <span className="create-automation-template-card__category rounded-full bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-600">
                              {template.category}
                            </span>
                          </span>
                          <span className="create-automation-template-card__description mt-1 block text-sm leading-relaxed text-zinc-500">
                            {template.description}
                          </span>
                          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700 ring-1 ring-orange-100">
                              {template.trigger}
                            </span>
                            <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 font-semibold text-[#1877f2] ring-1 ring-[#dbe7f8]">
                              {purposeToUi(template.purpose, template.trigger)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#1877f2]">
                              {template.nodes.length} steps
                              <ChevronRight
                                className="size-3.5 transition group-hover:translate-x-0.5"
                                aria-hidden
                              />
                            </span>
                          </span>
                        </span>
                      </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === "import-preview" && selectedTemplate ? (
                <>
                  <div className="create-automation-modal__body min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                    <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-4">
                      <p className="text-sm leading-relaxed text-zinc-700">
                        {selectedTemplate.description}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                            Trigger
                          </dt>
                          <dd className="mt-1 font-medium text-zinc-900">
                            {selectedTemplate.trigger}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                            Purpose
                          </dt>
                          <dd className="mt-1 font-medium text-zinc-900">
                            {purposeToUi(
                              selectedTemplate.purpose,
                              selectedTemplate.trigger,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                            Steps
                          </dt>
                          <dd className="mt-1 font-medium text-zinc-900">
                            {selectedTemplate.nodes.length}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Workflow steps
                      </p>
                      <ul className="space-y-2">
                        {selectedTemplate.nodes.map((node) => (
                          <TemplateNodePreview key={node.key} node={node} />
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="create-automation-modal__footer flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-100 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleUseTemplate}
                      disabled={isSubmitting}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-semibold text-white transition hover:bg-[#0f5ed7] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:h-11 sm:min-w-[9rem] sm:w-auto"
                    >
                      <Plus className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
                      {isSubmitting ? "Creating…" : "Use template"}
                    </button>
                  </div>
                </>
              ) : null}

              {step === "create-blank" ? (
                <form
                  className="create-automation-modal__form flex min-h-0 flex-1 flex-col"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim() || isSubmitting) return;
                    void onCreate({
                      name: name.trim(),
                      description: description.trim(),
                      trigger,
                      purpose,
                    });
                  }}
                >
                  <div className="create-automation-modal__body min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                    <div>
                      <FieldLabel icon={Type}>Automation name</FieldLabel>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Welcome New Signups"
                        className={fieldInputClass}
                      />
                    </div>
                    <div>
                      <FieldLabel icon={AlignLeft}>Description</FieldLabel>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        placeholder="What should this automation do?"
                        className={`${fieldTextareaClass} min-h-[4.5rem] sm:min-h-[5.5rem]`}
                      />
                    </div>
                    <div>
                      <FieldLabel icon={Zap} iconClassName="text-orange-600">
                        Trigger
                      </FieldLabel>
                      <RadioOptionGroup
                        name="automation-trigger"
                        value={trigger}
                        onChange={handleTriggerChange}
                        options={TRIGGERS.map((t) => ({ value: t, label: t }))}
                        accent="orange"
                      />
                    </div>
                    <div>
                      <FieldLabel icon={Workflow} iconClassName="text-[#1877f2]">
                        Purpose
                      </FieldLabel>
                      {cronAllowsPurposeChoice ? (
                        <>
                          <RadioOptionGroup
                            name="automation-purpose"
                            value={purpose}
                            onChange={setPurpose}
                            options={CRON_AUTOMATION_PURPOSE_OPTIONS.map(
                              (option) => ({
                                value: option.value,
                                label: option.label,
                              }),
                            )}
                            accent="blue"
                          />
                          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                            {
                              CRON_AUTOMATION_PURPOSE_OPTIONS.find(
                                (option) => option.value === purpose,
                              )?.description
                            }
                          </p>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-[#dbe7f8] bg-[#eff6ff] px-4 py-3.5">
                          <p className="m-0 text-sm font-semibold text-[#0f5ed7]">
                            {purposeMeta.label}
                          </p>
                          <p className="m-0 mt-1 text-sm leading-6 text-[#1d4ed8]/90">
                            {purposeMeta.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="create-automation-modal__footer flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-100 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!name.trim() || isSubmitting}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1877f2] px-5 text-sm font-semibold text-white transition hover:bg-[#0f5ed7] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:h-11 sm:min-w-[7rem] sm:w-auto"
                    >
                      <Plus className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
                      {isSubmitting ? "Creating…" : "Create"}
                    </button>
                  </div>
                </form>
              ) : null}
            </motion.div>
          </div>
        </motion.div>
  );
}
