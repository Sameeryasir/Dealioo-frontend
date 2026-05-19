"use client";

import { motion, AnimatePresence } from "framer-motion";
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

export function NodeSettingsPanel({
  node,
}: {
  node: WorkflowNode | null;
}) {
  const block = node ? getBlockByKind(node.kind) : null;
  const Icon = block?.icon;

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-zinc-200/90 bg-white/85 backdrop-blur-xl lg:w-[320px]">
      <div className="border-b border-zinc-100 px-4 py-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">
          Settings
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {node ? "Configure the selected block." : "Select a node on the canvas."}
        </p>
      </div>

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
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: automationEase }}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
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
                  {block.section}
                </p>
                <p className="truncate text-sm font-bold text-zinc-900">
                  {node.label}
                </p>
              </motion.div>
            </motion.div>

            {(node.kind === "wait" || node.kind === "delay") && (
              <WaitSettings />
            )}
            {node.kind === "send_email" && <EmailSettings />}
            {node.kind === "condition" && <ConditionSettings />}
            {node.kind === "send_sms" && <SmsSettings />}
            {node.kind === "send_whatsapp" && <WhatsappSettings />}
            {!["wait", "delay", "send_email", "condition", "send_sms", "send_whatsapp"].includes(
              node.kind,
            ) && (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-xs text-zinc-500">
                No additional settings for this block in the preview UI.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
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

function WaitSettings() {
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Delay value")}
      <input type="number" defaultValue={30} className={inputClass()} />
      {fieldLabel("Unit")}
      <div className="grid grid-cols-3 gap-2">
        {(["Minutes", "Hours", "Days"] as const).map((unit, i) => (
          <button
            key={unit}
            type="button"
            className={`cursor-pointer rounded-xl border px-2 py-2 text-xs font-semibold transition ${
              i === 0
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {unit}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function EmailSettings() {
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Template")}
      <select className={inputClass()} defaultValue={EMAIL_TEMPLATES[0]}>
        {EMAIL_TEMPLATES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {fieldLabel("Subject")}
      <input
        type="text"
        defaultValue="Complete your order — offer inside"
        className={inputClass()}
      />
      {fieldLabel("Preview")}
      <div className="rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-zinc-500">
          Email preview
        </p>
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          Complete your order — offer inside
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          Hi there — you started signing up but did not finish checkout. Here is
          a limited-time offer to come back.
        </p>
      </div>
    </motion.div>
  );
}

function ConditionSettings() {
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Condition type")}
      <select className={inputClass()} defaultValue={CONDITION_TYPES[0]}>
        {CONDITION_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {fieldLabel("Value")}
      <input type="text" defaultValue="true" className={inputClass()} />
    </motion.div>
  );
}

function SmsSettings() {
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Message")}
      <textarea
        rows={4}
        defaultValue="Hi! Your table offer is waiting — reply STOP to opt out."
        className="w-full resize-none rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10"
      />
    </motion.div>
  );
}

function WhatsappSettings() {
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {fieldLabel("Template")}
      <select className={inputClass()} defaultValue="order_reminder">
        <option value="order_reminder">Order reminder</option>
        <option value="welcome">Welcome message</option>
      </select>
    </motion.div>
  );
}