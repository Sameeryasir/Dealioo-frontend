"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Plus,
  Target,
  Type,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { automationEase } from "@/app/components/automation/automation-ui";
import {
  AUTOMATION_PURPOSE_OPTIONS,
  type AutomationPurpose,
} from "@/app/services/automation/types";

const TRIGGERS = ["Signup", "Payment", "Funnel Complete", "Tag Added"];
const ICON_STROKE = 2.5;
const fieldInputClass =
  "h-11 w-full rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500/25";
const fieldTextareaClass =
  "w-full resize-none rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500/25";

function FieldLabel({
  icon: Icon,
  children,
  iconClassName = "text-violet-600",
}: {
  icon: LucideIcon;
  children: ReactNode;
  iconClassName?: string;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
      <Icon className={`size-3.5 shrink-0 ${iconClassName}`} aria-hidden strokeWidth={ICON_STROKE} />
      {children}
    </label>
  );
}

function RadioOptionGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  accent = "violet",
}: {
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  accent?: "violet" | "amber";
}) {
  const accentClass = accent === "amber" ? "accent-amber-600" : "accent-violet-600";

  return (
    <div className="space-y-2.5 pl-0.5" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className={`size-4 shrink-0 ${accentClass}`}
            />
            <span className={selected ? "font-semibold text-zinc-900" : ""}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
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
  }) => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState(TRIGGERS[0]!);
  const [purpose, setPurpose] = useState<AutomationPurpose>(
    AUTOMATION_PURPOSE_OPTIONS[0]!.value,
  );

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setTrigger(TRIGGERS[0]!);
    setPurpose(AUTOMATION_PURPOSE_OPTIONS[0]!.value);
  }, [open]);

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
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-pointer bg-zinc-950/40 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-automation-title"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl ring-1 ring-zinc-950/5"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: automationEase }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-6 py-5">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                  aria-hidden
                >
                  <Workflow className="size-5" strokeWidth={ICON_STROKE} />
                </span>
                <div className="min-w-0">
                  <h2
                    id="create-automation-title"
                    className="text-lg font-bold tracking-tight text-zinc-900"
                  >
                    Create automation
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Name your workflow, set its purpose, and choose a trigger.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-900 bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 hover:border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                <X className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
              </button>
            </div>

            <form
              className="space-y-4 px-6 py-5"
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
              <div>
                <FieldLabel icon={Type}>Automation name</FieldLabel>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Recover Abandoned Checkout"
                  className={fieldInputClass}
                />
              </div>
              <div>
                <FieldLabel icon={AlignLeft}>Description</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What should this automation do?"
                  className={fieldTextareaClass}
                />
              </div>
              <div>
                <FieldLabel icon={Target} iconClassName="text-indigo-600">
                  Purpose
                </FieldLabel>
                <RadioOptionGroup
                  name="automation-purpose"
                  value={purpose}
                  onChange={setPurpose}
                  options={AUTOMATION_PURPOSE_OPTIONS}
                  accent="violet"
                />
              </div>
              <div>
                <FieldLabel icon={Zap} iconClassName="text-amber-600">
                  Trigger
                </FieldLabel>
                <RadioOptionGroup
                  name="automation-trigger"
                  value={trigger}
                  onChange={setTrigger}
                  options={TRIGGERS.map((t) => ({ value: t, label: t }))}
                  accent="amber"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isSubmitting}
                  className="inline-flex h-11 min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                >
                  <Plus className="size-4" aria-hidden strokeWidth={ICON_STROKE} />
                  {isSubmitting ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
