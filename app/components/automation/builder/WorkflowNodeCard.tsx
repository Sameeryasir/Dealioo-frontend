"use client";

import { motion } from "framer-motion";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import {
  blockSectionLabel,
  nodeToneClass,
} from "@/app/components/automation/automation-ui";
import type { WorkflowNode } from "@/app/components/automation/types";

type BlockTone = ReturnType<typeof getBlockByKind>["tone"];

function nodeBorderClass(tone: BlockTone, selected: boolean): string {
  const borders: Record<BlockTone, string> = {
    emerald: "border-emerald-200/90",
    blue: "border-blue-200/90",
    violet: "border-violet-200/90",
    orange: "border-orange-200/90",
    amber: "border-amber-200/90",
    zinc: "border-zinc-200/90",
  };
  return selected
    ? `${borders[tone]} shadow-[0_12px_40px_rgba(0,0,0,0.08)]`
    : `${borders[tone]} shadow-[0_4px_20px_rgba(0,0,0,0.05)]`;
}

function nodeGlowClass(tone: BlockTone): string {
  switch (tone) {
    case "emerald":
      return "from-emerald-400/20";
    case "blue":
      return "from-blue-400/20";
    case "violet":
      return "from-violet-400/25";
    case "orange":
      return "from-orange-400/20";
    case "amber":
      return "from-amber-400/20";
    default:
      return "from-zinc-400/15";
  }
}

function nodePortClass(tone: BlockTone, active: boolean): string {
  if (!active) {
    return "bg-zinc-200 group-hover:bg-zinc-300";
  }
  switch (tone) {
    case "emerald":
      return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    case "blue":
      return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    case "violet":
      return "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.55)]";
    case "orange":
      return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]";
    case "amber":
      return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    default:
      return "bg-zinc-500";
  }
}

function selectedRingClass(tone: BlockTone): string {
  switch (tone) {
    case "emerald":
      return "ring-emerald-400/45";
    case "blue":
      return "ring-blue-400/45";
    case "violet":
      return "ring-violet-400/50";
    case "orange":
      return "ring-orange-400/45";
    case "amber":
      return "ring-amber-400/45";
    default:
      return "ring-zinc-400/35";
  }
}

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
  const isActive = selected && !isGhost;

  return (
    <motion.div
      className={`group relative w-full ${isDragging ? "opacity-30" : ""}`}
      animate={
        isGhost ? { scale: 1.04, y: -2 } : isDragging ? { opacity: 0.3 } : { scale: 1, y: 0 }
      }
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {isActive ? (
        <div
          className={`pointer-events-none absolute -inset-1 rounded-[1.15rem] bg-gradient-to-b ${nodeGlowClass(block.tone)} to-transparent opacity-80 blur-md`}
          aria-hidden
        />
      ) : null}

      <div
        className={`relative flex items-center gap-4 rounded-2xl border bg-white py-4 pl-4 pr-4 text-left transition-all duration-300 ease-out select-none ${nodeBorderClass(block.tone, isActive)} ${
          isActive
            ? `ring-2 ring-offset-2 ring-offset-[#ececee] ${selectedRingClass(block.tone)} ${tone.accent} pl-3.5`
            : "hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(0,0,0,0.09)]"
        } ${
          isGhost
            ? "scale-[1.02] ring-2 ring-violet-400/50"
            : isPressing && !isDragging
              ? "scale-[0.99]"
              : ""
        }`}
      >
        <span
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent"
          aria-hidden
        />

        <span
          className={`relative flex size-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-white/90 ${tone.icon}`}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 to-transparent"
            aria-hidden
          />
          <Icon className="relative size-5" strokeWidth={2.25} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] ${tone.badge}`}
          >
            {sectionLabel}
          </span>
          <span className="mt-1.5 block truncate text-base font-semibold leading-tight tracking-tight text-zinc-900">
            {node.label}
          </span>
        </span>

        <span
          className={`size-2.5 shrink-0 rounded-full border-2 border-white transition-colors ${nodePortClass(block.tone, isActive)}`}
          aria-hidden
        />
      </div>
    </motion.div>
  );
}
