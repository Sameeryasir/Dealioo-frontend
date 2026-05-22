"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsSelectDropdown } from "@/app/components/automation/builder/SettingsSelectDropdown";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import {
  blockSectionLabel,
  nodeToneClass,
} from "@/app/components/automation/automation-ui";
import { automationEase } from "@/app/lib/motion";
import { primaryButtonMdClass } from "@/app/lib/panel-styles";
import type { WorkflowNode } from "@/app/components/automation/types";

const EMAIL_TEMPLATES = [
  "Abandoned checkout reminder",
  "Welcome series #1",
  "Review request",
];

const CONDITION_TYPES = [
  "Has not completed payment",
  "Opened email",
  "Tag equals VIP",
];

type WaitUnit = "minutes" | "hours" | "days";
type CronIntervalUnit = WaitUnit;
type CronFrequency = "daily" | "weekly" | "interval";
const CRON_INTERVAL_MIN = 1;
type CronDayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const CRON_DAYS: { id: CronDayOfWeek; label: string }[] = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

function configCronFrequency(config: Record<string, unknown>): CronFrequency {
  if (config.frequency === "weekly") return "weekly";
  if (config.frequency === "interval") return "interval";
  return "daily";
}

function configCronIntervalUnit(config: Record<string, unknown>): CronIntervalUnit {
  const value = config.unit;
  if (value === "hours" || value === "days" || value === "minutes") return value;
  return "minutes";
}

function configCronIntervalValue(config: Record<string, unknown>): number {
  const fromInterval = configNumber(config, "interval", 0);
  if (fromInterval >= CRON_INTERVAL_MIN) {
    return Math.max(CRON_INTERVAL_MIN, Math.floor(fromInterval));
  }
  const legacyMinutes = configNumber(config, "intervalMinutes", 5);
  return Math.max(CRON_INTERVAL_MIN, Math.floor(legacyMinutes));
}

function clampCronInterval(value: number): number {
  if (!Number.isFinite(value)) return CRON_INTERVAL_MIN;
  return Math.max(CRON_INTERVAL_MIN, Math.floor(value));
}

function cronIntervalUnitLabel(value: number, unit: CronIntervalUnit): string {
  if (unit === "minutes") return value === 1 ? "minute" : "minutes";
  if (unit === "hours") return value === 1 ? "hour" : "hours";
  return value === 1 ? "day" : "days";
}

function configCronDay(config: Record<string, unknown>): CronDayOfWeek {
  const value = config.dayOfWeek;
  const match = CRON_DAYS.find((d) => d.id === value);
  return match?.id ?? "monday";
}

function formatCronTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = Number.parseInt(hStr ?? "9", 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatCronScheduleSummary(config: Record<string, unknown>): string {
  const frequency = configCronFrequency(config);
  if (frequency === "interval") {
    const value = configCronIntervalValue(config);
    const unit = configCronIntervalUnit(config);
    return `Every ${value} ${cronIntervalUnitLabel(value, unit)}`;
  }
  const time = configString(config, "time", "09:00");
  const timeLabel = formatCronTime12h(time);
  if (frequency === "weekly") {
    const day = CRON_DAYS.find((d) => d.id === configCronDay(config))?.label ?? "Mon";
    return `Every ${day} at ${timeLabel}`;
  }
  return `Every day at ${timeLabel}`;
}

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
      return { template: values.template, subject: values.subject };
    case "condition":
      return {
        conditionType: values.conditionType,
        value: values.conditionValue,
      };
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
  onSave,
  onDelete,
  saving = false,
  deleting = false,
}: {
  node: WorkflowNode | null;
  onSave?: (config: Record<string, unknown>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  saving?: boolean;
  deleting?: boolean;
}) {
  const block = node ? getBlockByKind(node.kind) : null;
  const tone = block ? nodeToneClass(block.tone) : null;
  const Icon = block?.icon;

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-zinc-200/80 bg-white shadow-[inset_1px_0_0_rgba(0,0,0,0.02)] lg:w-[320px]">
      <motion.div className="border-b border-zinc-100/90 bg-zinc-50/40 px-4 py-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">
          Settings
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          {node ? "Configure the selected block." : "Select a step on the canvas."}
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
            className="flex flex-1 flex-col items-center justify-center px-6 text-center"
          >
            <p className="text-sm text-zinc-500">
              Click a workflow step to edit delay, message content, or conditions.
            </p>
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
  blockSection,
  tone,
  icon: Icon,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  node: WorkflowNode;
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
    configString(config, "subject", "Complete your order — offer inside"),
  );
  const [conditionType, setConditionType] = useState(() =>
    configString(config, "conditionType", CONDITION_TYPES[0]),
  );
  const [conditionValue, setConditionValue] = useState(() =>
    configString(config, "value", "true"),
  );
  const [message, setMessage] = useState(() =>
    configString(
      config,
      "message",
      "Hi! Your table offer is waiting — reply STOP to opt out.",
    ),
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
      configString(saved, "subject", "Complete your order — offer inside"),
    );
    setConditionType(configString(saved, "conditionType", CONDITION_TYPES[0]));
    setConditionValue(configString(saved, "value", "true"));
    setMessage(
      configString(
        saved,
        "message",
        "Hi! Your table offer is waiting — reply STOP to opt out.",
      ),
    );
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
        void onSave(
          buildConfigForNode(node.kind, {
            delay,
            unit,
            template,
            subject,
            conditionType,
            conditionValue,
            message,
            whatsappTemplate,
            cronFrequency,
            cronTime,
            cronDayOfWeek,
            cronInterval,
            cronIntervalUnit,
          }),
        );
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <motion.div
        className={`mb-4 flex items-center gap-3 rounded-xl border px-3 py-2.5 ${tone?.shell ?? "border-zinc-200/90 bg-zinc-50/80"}`}
        layout
      >
        {Icon && tone ? (
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${tone.icon}`}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <motion.div className="min-w-0">
          <span
            className={`inline-flex rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${tone?.badge ?? "bg-zinc-100 text-zinc-600"}`}
          >
            {blockSectionLabel(blockSection)}
          </span>
          <p className="mt-1 truncate text-sm font-bold text-zinc-900">{node.label}</p>
        </motion.div>
      </motion.div>

      {node.kind === "cron_trigger" && (
        <CronSettings
          frequency={cronFrequency}
          time={cronTime}
          dayOfWeek={cronDayOfWeek}
          interval={cronInterval}
          intervalUnit={cronIntervalUnit}
          summary={cronPreview}
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
          onDelayChange={setDelay}
          onUnitChange={setUnit}
        />
      )}
      {node.kind === "send_email" && (
        <EmailSettings
          template={template}
          subject={subject}
          onTemplateChange={setTemplate}
          onSubjectChange={setSubject}
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
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-4 text-xs leading-relaxed text-zinc-500">
          No additional settings for this block.
        </p>
      )}
      </div>

      {(editable && onSave) || onDelete ? (
        <div className="shrink-0 border-t border-zinc-100/90 bg-white/95 px-4 pt-4 pb-5 backdrop-blur-sm">
          {editable && onSave ? (
            <button
              type="submit"
              disabled={saving || deleting}
              className={`mb-4 w-full ${primaryButtonMdClass}`}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              disabled={deleting || saving}
              onClick={() => void onDelete()}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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

function fieldLabel(text: string) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
      {text}
    </label>
  );
}

function inputClass() {
  return "h-10 w-full rounded-xl border border-zinc-200/90 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10";
}

function CronSettings({
  frequency,
  time,
  dayOfWeek,
  interval,
  intervalUnit,
  summary,
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
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("How often")}
      <div className="grid grid-cols-3 gap-2">
        {frequencies.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFrequencyChange(item.id)}
            className={`cursor-pointer rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
              frequency === item.id
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {frequency === "weekly" ? (
        <>
          {fieldLabel("Day of week")}
          <SettingsSelectDropdown
            value={dayOfWeek}
            options={CRON_DAYS.map((d) => ({ value: d.id, label: d.label }))}
            onChange={(v) => onDayOfWeekChange(v as CronDayOfWeek)}
            ariaLabel="Day of week"
          />
        </>
      ) : null}

      {frequency === "interval" ? (
        <>
          {fieldLabel("Run every")}
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
          {fieldLabel("Unit")}
          <div className="grid grid-cols-3 gap-2">
            {intervalUnits.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onIntervalUnitChange(item.id)}
                className={`cursor-pointer rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                  intervalUnit === item.id
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p id="cron-interval-hint" className="text-xs text-zinc-500">
            At least {CRON_INTERVAL_MIN} {cronIntervalUnitLabel(1, intervalUnit)}.
          </p>
        </>
      ) : (
        <>
          {fieldLabel("Run at")}
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className={inputClass()}
          />
        </>
      )}

      <p className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 text-xs font-medium leading-relaxed text-emerald-900">
        {summary}
      </p>
    </motion.div>
  );
}

function WaitSettings({
  delay,
  unit,
  onDelayChange,
  onUnitChange,
}: {
  delay: number;
  unit: WaitUnit;
  onDelayChange: (value: number) => void;
  onUnitChange: (value: WaitUnit) => void;
}) {
  const units: { id: WaitUnit; label: string }[] = [
    { id: "minutes", label: "Minutes" },
    { id: "hours", label: "Hours" },
    { id: "days", label: "Days" },
  ];

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Delay value")}
      <input
        type="number"
        min={1}
        value={delay}
        onChange={(e) => onDelayChange(Number.parseInt(e.target.value, 10) || 1)}
        className={inputClass()}
      />
      {fieldLabel("Unit")}
      <div className="grid grid-cols-3 gap-2">
        {units.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onUnitChange(item.id)}
            className={`cursor-pointer rounded-xl border px-2 py-2 text-xs font-semibold transition ${
              unit === item.id
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function EmailSettings({
  template,
  subject,
  onTemplateChange,
  onSubjectChange,
}: {
  template: string;
  subject: string;
  onTemplateChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
}) {
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Template")}
      <SettingsSelectDropdown
        value={template}
        options={EMAIL_TEMPLATES.map((t) => ({ value: t, label: t }))}
        onChange={onTemplateChange}
        ariaLabel="Email template"
      />
      {fieldLabel("Subject")}
      <input
        type="text"
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        className={inputClass()}
      />
    </motion.div>
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
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Condition type")}
      <SettingsSelectDropdown
        value={conditionType}
        options={CONDITION_TYPES.map((t) => ({ value: t, label: t }))}
        onChange={onConditionTypeChange}
        ariaLabel="Condition type"
      />
      {fieldLabel("Value")}
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={inputClass()}
      />
    </motion.div>
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
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Message")}
      <textarea
        rows={4}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
      />
    </motion.div>
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
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Template")}
      <SettingsSelectDropdown
        value={template}
        options={[
          { value: "order_reminder", label: "Order reminder" },
          { value: "welcome", label: "Welcome message" },
        ]}
        onChange={onTemplateChange}
        ariaLabel="WhatsApp template"
      />
    </motion.div>
  );
}
