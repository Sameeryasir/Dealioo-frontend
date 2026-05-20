"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import { automationEase } from "@/app/components/automation/automation-ui";
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
  },
): Record<string, unknown> {
  switch (kind) {
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
  const Icon = block?.icon;

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-zinc-200/90 bg-white/85 backdrop-blur-xl lg:w-[320px]">
      <motion.div className="border-b border-zinc-100 px-4 py-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">
          Settings
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {node ? "Configure the selected block." : "Select a node on the canvas."}
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
  icon: Icon,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  node: WorkflowNode;
  blockSection: string;
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
  }, [node.id, configKey]);

  return (
    <motion.form
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: automationEase }}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
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
          }),
        );
      }}
    >
      <motion.div
        className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-2.5"
        layout
      >
        {Icon ? (
          <span className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <motion.div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {blockSection}
          </p>
          <p className="truncate text-sm font-bold text-zinc-900">{node.label}</p>
        </motion.div>
      </motion.div>

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
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-xs text-zinc-500">
          No additional settings for this block.
        </p>
      )}

      {editable && onSave ? (
        <div className="mt-4">
          <button
            type="submit"
            disabled={saving || deleting}
            className="w-full cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : null}

      {onDelete ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={deleting || saving}
            onClick={() => void onDelete()}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
            {deleting ? "Removing…" : "Delete step"}
          </button>
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
      <select
        value={template}
        onChange={(e) => onTemplateChange(e.target.value)}
        className={inputClass()}
      >
        {EMAIL_TEMPLATES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
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
      <select
        value={conditionType}
        onChange={(e) => onConditionTypeChange(e.target.value)}
        className={inputClass()}
      >
        {CONDITION_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
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
      <select
        value={template}
        onChange={(e) => onTemplateChange(e.target.value)}
        className={inputClass()}
      >
        <option value="order_reminder">Order reminder</option>
        <option value="welcome">Welcome message</option>
      </select>
    </motion.div>
  );
}
