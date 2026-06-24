"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  MousePointerClick,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { SettingsSelectDropdown } from "@/app/components/automation/builder/SettingsSelectDropdown";
import { validatePaymentReminderSchedule } from "@/app/components/automation/payment-reminder-schedule-validation";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import {
  blockSectionLabel,
  nodeToneClass,
} from "@/app/components/automation/automation-ui";
import { automationEase } from "@/app/lib/motion";
import type { WorkflowNode } from "@/app/components/automation/types";

const EMAIL_TEMPLATES = [
  "Payment reminder",
  "QR pass guide",
  "Abandoned checkout reminder",
];

const CONDITION_TYPES = [
  "Has not completed payment",
  "Opened email",
  "Tag equals VIP",
];

import {
  CRON_DAYS,
  CRON_INTERVAL_MIN,
  clampCronInterval,
  configCronDay,
  configCronFrequency,
  configCronIntervalUnit,
  configCronIntervalValue,
  cronIntervalUnitLabel,
  formatCronScheduleSummary,
  type CronDayOfWeek,
  type CronFrequency,
  type CronIntervalUnit,
} from "@/app/components/automation/builder/cron-schedule-display";

type WaitUnit = "minutes" | "hours" | "days";

function configString(
  config: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function configNumber(
  config: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function initialConditionValue(config: Record<string, unknown>): string {
  const value = configString(config, "value", "Status not paid");
  if (value === "true") return "Status not paid";
  return value.replace(/^NOT\s+/i, "").trim() || value || "Status not paid";
}

function configUnit(config: Record<string, unknown>): WaitUnit {
  const value = config.unit;
  if (value === "hours" || value === "days" || value === "minutes") {
    return value;
  }
  return "minutes";
}

function hasEditableSettings(kind: WorkflowNode["kind"]): boolean {
  return [
    "wait",
    "delay",
    "cron_trigger",
    "send_email",
    "condition",
    "send_sms",
    "send_whatsapp",
  ].includes(kind);
}

function buildConfigForNode(
  kind: WorkflowNode["kind"],
  values: {
    delay: number;
    unit: WaitUnit;
    template: string;
    subject: string;
    conditionType: string;
    conditionValue: string;
    message: string;
    ctaLabel: string;
    whatsappTemplate: string;
    cronFrequency: CronFrequency;
    cronTime: string;
    cronDayOfWeek: CronDayOfWeek;
    cronInterval: number;
    cronIntervalUnit: CronIntervalUnit;
  },
): Record<string, unknown> {
  switch (kind) {
    case "cron_trigger":
      if (values.cronFrequency === "interval") {
        return {
          trigger: "cron",
          frequency: "interval",
          interval: clampCronInterval(values.cronInterval),
          unit: values.cronIntervalUnit,
        };
      }
      return {
        trigger: "cron",
        frequency: values.cronFrequency,
        time: values.cronTime,
        dayOfWeek: values.cronDayOfWeek,
      };
    case "wait":
    case "delay":
      return { delay: values.delay, unit: values.unit };
    case "send_email":
      return {
        template: values.template,
        subject: values.subject,
        message: values.message.trim(),
        ctaLabel: values.ctaLabel.trim() || "Complete payment",
      };
    case "condition": {
      const label =
        values.conditionValue.replace(/^NOT\s+/i, "").trim() || "Status not paid";
      return {
        conditionType: values.conditionType,
        value: values.conditionValue.startsWith("NOT")
          ? values.conditionValue
          : `NOT ${label}`,
        conditions: [{ negated: true, value: label }],
      };
    }
    case "send_sms":
      return { message: values.message.trim() };
    case "send_whatsapp":
      return { template: values.whatsappTemplate };
    default:
      return {};
  }
}

export function NodeSettingsPanel({
  node,
  nodes = [],
  automationPurpose,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
}: {
  node: WorkflowNode | null;
  nodes?: WorkflowNode[];
  automationPurpose?: string | null;
  onSave?: (config: Record<string, unknown>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  saving?: boolean;
  deleting?: boolean;
}) {
  const block = node ? getBlockByKind(node.kind) : null;
  const tone = block ? nodeToneClass(block.tone) : null;
  const Icon = block?.icon;

  return (
    <aside className="relative flex h-full w-full min-w-0 flex-col overflow-hidden border-l border-zinc-200/60 bg-white">
      <motion.div className="relative border-b border-zinc-100 px-5 py-5">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          Settings
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          {node ? "Configure the selected step." : "Select a step on the canvas."}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!node || !block ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: automationEase }}
            className="relative flex flex-1 flex-col items-center justify-center px-5 py-8 text-center"
          >
            <div className="w-full max-w-[15rem] rounded-2xl border-2 border-dashed border-zinc-200/90 bg-white/70 px-5 py-8 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-sm">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200/80">
                <MousePointerClick className="size-5" strokeWidth={2} aria-hidden />
              </div>
              <p className="text-sm font-semibold text-zinc-800">No step selected</p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                Click a workflow step to edit delay, messages, or schedule settings.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={node.id}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: automationEase }}
          >
            <NodeSettingsForm
              node={node}
              nodes={nodes}
              automationPurpose={automationPurpose}
              blockSection={block.section}
              tone={tone}
              icon={Icon}
              onSave={onSave}
              onDelete={onDelete}
              saving={saving}
              deleting={deleting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function NodeSettingsForm({
  node,
  nodes,
  automationPurpose,
  blockSection,
  tone,
  icon: Icon,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  node: WorkflowNode;
  nodes: WorkflowNode[];
  automationPurpose?: string | null;
  blockSection: string;
  tone: ReturnType<typeof nodeToneClass> | null;
  icon?: LucideIcon;
  onSave?: (config: Record<string, unknown>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  saving: boolean;
  deleting: boolean;
}) {
  const config = node.config;
  const editable = hasEditableSettings(node.kind);

  const [delay, setDelay] = useState(() =>
    configNumber(config, "delay", 30),
  );
  const [unit, setUnit] = useState<WaitUnit>(() => configUnit(config));
  const [template, setTemplate] = useState(() =>
    configString(config, "template", EMAIL_TEMPLATES[0]),
  );
  const [subject, setSubject] = useState(() =>
    configString(
      config,
      "subject",
      node.kind === "send_email"
        ? "Complete your payment — your offer is waiting"
        : "Complete your order — offer inside",
    ),
  );
  const [conditionType, setConditionType] = useState(() =>
    configString(config, "conditionType", CONDITION_TYPES[0]),
  );
  const [conditionValue, setConditionValue] = useState(() =>
    initialConditionValue(config),
  );
  const [message, setMessage] = useState(() =>
    configString(
      config,
      "message",
      node.kind === "send_email"
        ? "Hi — thank you for signing up! Your offer is almost ready. Please complete your payment to unlock it. If you already paid, you can ignore this email."
        : "Hi! Your table offer is waiting — reply STOP to opt out.",
    ),
  );
  const [ctaLabel, setCtaLabel] = useState(() =>
    configString(config, "ctaLabel", "Complete payment"),
  );
  const [whatsappTemplate, setWhatsappTemplate] = useState(() =>
    configString(config, "template", "order_reminder"),
  );
  const [cronFrequency, setCronFrequency] = useState<CronFrequency>(() =>
    configCronFrequency(config),
  );
  const [cronTime, setCronTime] = useState(() =>
    configString(config, "time", "09:00"),
  );
  const [cronDayOfWeek, setCronDayOfWeek] = useState<CronDayOfWeek>(() =>
    configCronDay(config),
  );
  const [cronInterval, setCronInterval] = useState(() =>
    configCronIntervalValue(config),
  );
  const [cronIntervalUnit, setCronIntervalUnit] = useState<CronIntervalUnit>(() =>
    configCronIntervalUnit(config),
  );

  const configKey = JSON.stringify(node.config ?? {});

  useEffect(() => {
    let saved: Record<string, unknown> = {};
    try {
      saved = JSON.parse(configKey) as Record<string, unknown>;
    } catch {
      saved = {};
    }
    setDelay(configNumber(saved, "delay", 30));
    setUnit(configUnit(saved));
    setTemplate(configString(saved, "template", EMAIL_TEMPLATES[0]));
    setSubject(
      configString(
        saved,
        "subject",
        node.kind === "send_email"
          ? "Complete your payment — your offer is waiting"
          : "Complete your order — offer inside",
      ),
    );
    setConditionType(configString(saved, "conditionType", CONDITION_TYPES[0]));
    setConditionValue(initialConditionValue(saved));
    setMessage(
      configString(
        saved,
        "message",
        node.kind === "send_email"
          ? "Hi — thank you for signing up! Your offer is almost ready. Please complete your payment to unlock it. If you already paid, you can ignore this email."
          : "Hi! Your table offer is waiting — reply STOP to opt out.",
      ),
    );
    setCtaLabel(configString(saved, "ctaLabel", "Complete payment"));
    setWhatsappTemplate(configString(saved, "template", "order_reminder"));
    setCronFrequency(configCronFrequency(saved));
    setCronTime(configString(saved, "time", "09:00"));
    setCronDayOfWeek(configCronDay(saved));
    setCronInterval(configCronIntervalValue(saved));
    setCronIntervalUnit(configCronIntervalUnit(saved));
  }, [node.id, configKey]);

  const cronPreview = formatCronScheduleSummary({
    frequency: cronFrequency,
    time: cronTime,
    dayOfWeek: cronDayOfWeek,
    interval: cronInterval,
    unit: cronIntervalUnit,
  });

  const pendingFormValues = {
    delay,
    unit,
    template,
    subject,
    conditionType,
    conditionValue,
    message,
    ctaLabel,
    whatsappTemplate,
    cronFrequency,
    cronTime,
    cronDayOfWeek,
    cronInterval,
    cronIntervalUnit,
  };

  const scheduleWarning = useMemo(() => {
    if (
      node.kind !== "cron_trigger" &&
      node.kind !== "wait" &&
      node.kind !== "delay"
    ) {
      return null;
    }

    const nextConfig = buildConfigForNode(node.kind, {
      delay,
      unit,
      template,
      subject,
      conditionType,
      conditionValue,
      message,
      ctaLabel,
      whatsappTemplate,
      cronFrequency,
      cronTime,
      cronDayOfWeek,
      cronInterval,
      cronIntervalUnit,
    });
    const validation = validatePaymentReminderSchedule(nodes, automationPurpose, {
      nodeId: node.id,
      config: nextConfig,
    });
    return validation.ok ? null : validation.message;
  }, [
    automationPurpose,
    ctaLabel,
    cronDayOfWeek,
    cronFrequency,
    cronInterval,
    cronIntervalUnit,
    cronTime,
    delay,
    message,
    node.id,
    node.kind,
    nodes,
    subject,
    unit,
  ]);

  return (
    <motion.form
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: automationEase }}
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!onSave) return;

        const nextConfig = buildConfigForNode(node.kind, pendingFormValues);
        const validation = validatePaymentReminderSchedule(
          nodes,
          automationPurpose,
          { nodeId: node.id, config: nextConfig },
        );
        if (!validation.ok) {
          toast.error(validation.message);
          return;
        }

        void onSave(nextConfig);
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 [scrollbar-gutter:stable]">
      <motion.div
        className={`mb-8 flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/40 px-4 py-3.5 ${tone?.accent ?? "border-l-[3px] border-l-zinc-400"}`}
        layout
      >
        {Icon && tone ? (
          <span
            className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
          >
            <Icon className="relative size-[1.125rem]" strokeWidth={2.15} aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${tone?.badge ?? "bg-zinc-100 text-zinc-600"}`}
          >
            {blockSectionLabel(blockSection)}
          </span>
          <p className="mt-1 truncate text-[0.9375rem] font-semibold tracking-tight text-zinc-900">
            {node.label}
          </p>
        </div>
      </motion.div>

      <div className="space-y-8">
      {node.kind === "cron_trigger" && (
        <CronSettings
          frequency={cronFrequency}
          time={cronTime}
          dayOfWeek={cronDayOfWeek}
          interval={cronInterval}
          intervalUnit={cronIntervalUnit}
          summary={cronPreview}
          scheduleWarning={scheduleWarning}
          onFrequencyChange={setCronFrequency}
          onTimeChange={setCronTime}
          onDayOfWeekChange={setCronDayOfWeek}
          onIntervalChange={setCronInterval}
          onIntervalUnitChange={setCronIntervalUnit}
        />
      )}
      {(node.kind === "wait" || node.kind === "delay") && (
        <WaitSettings
          delay={delay}
          unit={unit}
          scheduleWarning={scheduleWarning}
          onDelayChange={setDelay}
          onUnitChange={setUnit}
        />
      )}
      {node.kind === "send_email" && (
        <EmailSettings
          template={template}
          subject={subject}
          message={message}
          ctaLabel={ctaLabel}
          onTemplateChange={setTemplate}
          onSubjectChange={setSubject}
          onMessageChange={setMessage}
          onCtaLabelChange={setCtaLabel}
        />
      )}
      {node.kind === "condition" && (
        <ConditionSettings
          conditionType={conditionType}
          value={conditionValue}
          onConditionTypeChange={setConditionType}
          onValueChange={setConditionValue}
        />
      )}
      {node.kind === "send_sms" && (
        <SmsSettings message={message} onMessageChange={setMessage} />
      )}
      {node.kind === "send_whatsapp" && (
        <WhatsappSettings
          template={whatsappTemplate}
          onTemplateChange={setWhatsappTemplate}
        />
      )}
      {!editable && (
        <SettingsSection>
          <p className="text-sm leading-relaxed text-zinc-500">
            No additional settings for this block.
          </p>
        </SettingsSection>
      )}
      </div>
      </div>

      {(editable && onSave) || onDelete ? (
        <div className="relative shrink-0 space-y-3 border-t border-zinc-100 bg-white px-5 py-6">
          {editable && onSave ? (
            <button
              type="submit"
              disabled={saving || deleting || Boolean(scheduleWarning)}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              disabled={deleting || saving}
              onClick={() => void onDelete()}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
              {deleting ? "Removing…" : "Delete step"}
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.form>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      {title || description ? (
        <div className="space-y-1">
          {title ? (
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-xs leading-relaxed text-zinc-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

function inputClass() {
  return "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5";
}

function textareaClass() {
  return "w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/5";
}

function SegmentGroup({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-zinc-100/70 p-1.5">
      {children}
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
        active
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80"
          : "text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryBanner({
  summary,
  tone = "emerald",
}: {
  summary: string;
  tone?: "emerald" | "violet" | "blue" | "orange";
}) {
  const styles = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    violet: "border-violet-100 bg-violet-50/70 text-violet-800",
    blue: "border-blue-100 bg-blue-50/70 text-blue-800",
    orange: "border-orange-100 bg-orange-50/70 text-orange-800",
  };

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3.5 text-sm leading-relaxed ${styles[tone]}`}
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 opacity-70" aria-hidden />
      <span>{summary}</span>
    </div>
  );
}

function CronSettings({
  frequency,
  time,
  dayOfWeek,
  interval,
  intervalUnit,
  summary,
  scheduleWarning,
  onFrequencyChange,
  onTimeChange,
  onDayOfWeekChange,
  onIntervalChange,
  onIntervalUnitChange,
}: {
  frequency: CronFrequency;
  time: string;
  dayOfWeek: CronDayOfWeek;
  interval: number;
  intervalUnit: CronIntervalUnit;
  summary: string;
  scheduleWarning?: string | null;
  onFrequencyChange: (value: CronFrequency) => void;
  onTimeChange: (value: string) => void;
  onDayOfWeekChange: (value: CronDayOfWeek) => void;
  onIntervalChange: (value: number) => void;
  onIntervalUnitChange: (value: CronIntervalUnit) => void;
}) {
  const frequencies: { id: CronFrequency; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "interval", label: "Interval" },
  ];

  const intervalUnits: { id: CronIntervalUnit; label: string }[] = [
    { id: "minutes", label: "Minutes" },
    { id: "hours", label: "Hours" },
    { id: "days", label: "Days" },
  ];

  return (
    <SettingsSection title="Schedule" description="Choose when this automation should run.">
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SummaryBanner summary={summary} tone="violet" />
      {scheduleWarning ? (
        <SummaryBanner summary={scheduleWarning} tone="orange" />
      ) : null}

      <FormField label="How often">
        <SegmentGroup>
          {frequencies.map((item) => (
            <SegmentButton
              key={item.id}
              active={frequency === item.id}
              onClick={() => onFrequencyChange(item.id)}
            >
              {item.label}
            </SegmentButton>
          ))}
        </SegmentGroup>
      </FormField>

      {frequency === "weekly" ? (
        <FormField label="Day of week">
          <SettingsSelectDropdown
            value={dayOfWeek}
            options={CRON_DAYS.map((d) => ({ value: d.id, label: d.label }))}
            onChange={(v) => onDayOfWeekChange(v as CronDayOfWeek)}
            ariaLabel="Day of week"
          />
        </FormField>
      ) : null}

      {frequency === "interval" ? (
        <>
          <FormField label="Run every">
            <input
              type="number"
              min={CRON_INTERVAL_MIN}
              step={1}
              inputMode="numeric"
              value={interval}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                onIntervalChange(clampCronInterval(parsed));
              }}
              onBlur={() => onIntervalChange(clampCronInterval(interval))}
              className={inputClass()}
              aria-describedby="cron-interval-hint"
            />
          </FormField>
          <FormField label="Unit">
            <SegmentGroup>
              {intervalUnits.map((item) => (
                <SegmentButton
                  key={item.id}
                  active={intervalUnit === item.id}
                  onClick={() => onIntervalUnitChange(item.id)}
                >
                  {item.label}
                </SegmentButton>
              ))}
            </SegmentGroup>
          </FormField>
          <p id="cron-interval-hint" className="text-xs leading-relaxed text-zinc-500">
            At least {CRON_INTERVAL_MIN} {cronIntervalUnitLabel(1, intervalUnit)}.
          </p>
        </>
      ) : (
        <FormField label="Run at">
          <div className="relative">
            <input
              type="time"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              className={inputClass()}
            />
            <CalendarClock
              className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
          </div>
        </FormField>
      )}
    </motion.div>
    </SettingsSection>
  );
}

function WaitSettings({
  delay,
  unit,
  scheduleWarning,
  onDelayChange,
  onUnitChange,
}: {
  delay: number;
  unit: WaitUnit;
  scheduleWarning?: string | null;
  onDelayChange: (value: number) => void;
  onUnitChange: (value: WaitUnit) => void;
}) {
  const units: { id: WaitUnit; label: string }[] = [
    { id: "minutes", label: "Minutes" },
    { id: "hours", label: "Hours" },
    { id: "days", label: "Days" },
  ];

  return (
    <SettingsSection title="Timing" description="Wait before the next step runs.">
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {scheduleWarning ? (
        <SummaryBanner summary={scheduleWarning} tone="orange" />
      ) : null}
      <FormField label="Delay value">
        <input
          type="number"
          min={1}
          value={delay}
          onChange={(e) => onDelayChange(Number.parseInt(e.target.value, 10) || 1)}
          className={inputClass()}
        />
      </FormField>
      <FormField label="Unit">
        <SegmentGroup>
          {units.map((item) => (
            <SegmentButton
              key={item.id}
              active={unit === item.id}
              onClick={() => onUnitChange(item.id)}
            >
              {item.label}
            </SegmentButton>
          ))}
        </SegmentGroup>
      </FormField>
    </motion.div>
    </SettingsSection>
  );
}

function EmailSettings({
  template,
  subject,
  message,
  ctaLabel,
  onTemplateChange,
  onSubjectChange,
  onMessageChange,
  onCtaLabelChange,
}: {
  template: string;
  subject: string;
  message: string;
  ctaLabel: string;
  onTemplateChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onCtaLabelChange: (value: string) => void;
}) {
  return (
    <SettingsSection
      title="Email"
      description="Subject and message are sent exactly as you write them."
    >
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FormField label="Template">
        <SettingsSelectDropdown
          value={template}
          options={EMAIL_TEMPLATES.map((t) => ({ value: t, label: t }))}
          onChange={onTemplateChange}
          ariaLabel="Email template"
        />
      </FormField>
      <FormField label="Subject">
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className={inputClass()}
        />
      </FormField>
      <FormField label="Message">
        <textarea
          rows={6}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className={textareaClass()}
        />
      </FormField>
      <FormField label="Button label">
        <input
          type="text"
          value={ctaLabel}
          onChange={(e) => onCtaLabelChange(e.target.value)}
          className={inputClass()}
        />
      </FormField>
    </motion.div>
    </SettingsSection>
  );
}

function ConditionSettings({
  conditionType,
  value,
  onConditionTypeChange,
  onValueChange,
}: {
  conditionType: string;
  value: string;
  onConditionTypeChange: (value: string) => void;
  onValueChange: (value: string) => void;
}) {
  return (
    <SettingsSection title="Condition" description="Define when this branch should run.">
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FormField label="Condition type">
        <SettingsSelectDropdown
          value={conditionType}
          options={CONDITION_TYPES.map((t) => ({ value: t, label: t }))}
          onChange={onConditionTypeChange}
          ariaLabel="Condition type"
        />
      </FormField>
      <FormField label="Value">
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={inputClass()}
        />
      </FormField>
    </motion.div>
    </SettingsSection>
  );
}

function SmsSettings({
  message,
  onMessageChange,
}: {
  message: string;
  onMessageChange: (value: string) => void;
}) {
  return (
    <SettingsSection title="SMS" description="Message sent to the customer.">
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FormField label="Message">
        <textarea
          rows={5}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className={textareaClass()}
        />
      </FormField>
    </motion.div>
    </SettingsSection>
  );
}

function WhatsappSettings({
  template,
  onTemplateChange,
}: {
  template: string;
  onTemplateChange: (value: string) => void;
}) {
  return (
    <SettingsSection title="WhatsApp" description="Choose the template for this message.">
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FormField label="Template">
        <SettingsSelectDropdown
          value={template}
          options={[
            { value: "order_reminder", label: "Order reminder" },
            { value: "welcome", label: "Welcome message" },
          ]}
          onChange={onTemplateChange}
          ariaLabel="WhatsApp template"
        />
      </FormField>
    </motion.div>
    </SettingsSection>
  );
}
