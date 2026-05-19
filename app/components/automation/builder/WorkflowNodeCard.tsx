"use client";

import { GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import { nodeToneClass } from "@/app/components/automation/automation-ui";
import type { WorkflowNode } from "@/app/components/automation/types";

export function WorkflowNodeCard({
  node,
  selected,
  onSelect,
}: {
  node: WorkflowNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const block = getBlockByKind(node.kind);
  const tone = nodeToneClass(block.tone);
  const Icon = block.icon;

  return (
    <motion.button
      type="button"
      drag
      dragConstraints={{ left: -40, right: 40, top: 0, bottom: 0 }}
      dragElastic={0.12}
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group flex w-full max-w-md cursor-grab items-center gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-md transition active:cursor-grabbing ${tone.shell} ${
        selected ? `ring-2 ${tone.ring}` : "ring-1 ring-zinc-950/[0.04]"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${tone.icon}`}
      >
        <Icon className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-bold uppercase tracking-wide text-zinc-500">
          {block.section === "triggers"
            ? "Trigger"
            : block.section === "conditions"
              ? "Condition"
              : block.section === "flow"
                ? "Flow"
                : "Action"}
        </span>
        <span className="mt-0.5 block text-base font-semibold text-zinc-900">
          {node.label}
        </span>
      </span>
      <GripVertical
        className="size-4 shrink-0 text-zinc-300 opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
    </motion.button>
  );
}