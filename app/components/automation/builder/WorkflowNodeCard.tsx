"use client";

import { motion } from "framer-motion";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import {
  blockSectionLabel,
  nodeToneClass,
} from "@/app/components/automation/automation-ui";
import type { WorkflowNode } from "@/app/components/automation/types";

export function WorkflowNodeCard({
  node,
  selected,
  isDragging = false,
  isPressing = false,
  isGhost = false,
}: {
  node: WorkflowNode;
  selected: boolean;
  isDragging?: boolean;
  isPressing?: boolean;
  isGhost?: boolean;
}) {
  const block = getBlockByKind(node.kind);
  const tone = nodeToneClass(block.tone);
  const Icon = block.icon;

  const sectionLabel = blockSectionLabel(block.section);

  return (
    <motion.div
      className={`flex w-full items-center gap-3 rounded-2xl border py-3.5 pr-4 text-left transition select-none ${tone.shell} ${
        selected && !isGhost
          ? `border-l-[3px] pl-3.5 ${tone.accent}`
          : "border-l-[3px] border-l-transparent px-4"
      } ${
        isGhost
          ? "scale-[1.03] shadow-2xl ring-2 ring-violet-400/70"
          : selected
            ? `shadow-lg ring-2 ${tone.ring}`
            : "shadow-sm ring-1 ring-zinc-950/[0.04] hover:shadow-md"
      } ${isDragging ? "opacity-30" : ""} ${
        isPressing && !isDragging && !isGhost ? "scale-[0.99] ring-2 ring-violet-200/80" : ""
      }`}
      animate={isGhost ? { scale: 1.03 } : isDragging ? { opacity: 0.3 } : { scale: 1 }}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${tone.icon}`}
      >
        <Icon className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`inline-flex rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${tone.badge}`}
        >
          {sectionLabel}
        </span>
        <span className="mt-1 block truncate text-[0.95rem] font-semibold leading-snug text-zinc-900">
          {node.label}
        </span>
      </span>
    </motion.div>
  );
}
