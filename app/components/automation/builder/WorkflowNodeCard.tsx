"use client";

import { motion } from "framer-motion";
import { FlowStepCard } from "@/app/components/automation/builder/flow-step-cards";
import type { WorkflowNode } from "@/app/components/automation/types";

export function WorkflowNodeCard({
  node,
  selected,
  invalid = false,
  invalidStepIds,
  isDragging = false,
  isPressing = false,
  isGhost = false,
  reorderLocked = false,
}: {
  node: WorkflowNode;
  selected: boolean;
  invalid?: boolean;
  invalidStepIds?: ReadonlySet<string> | readonly string[];
  isDragging?: boolean;
  isPressing?: boolean;
  isGhost?: boolean;
  reorderLocked?: boolean;
}) {
  void reorderLocked;
  return (
    <motion.div
      className={`relative w-full ${isDragging ? "opacity-30" : ""}`}
      animate={
        isGhost
          ? { scale: 1.02, y: -2 }
          : isDragging
            ? { opacity: 0.3 }
            : { scale: 1, y: 0 }
      }
    >
      <FlowStepCard
        node={node}
        selected={selected && !isGhost}
        pressing={isPressing && !isGhost}
        invalid={invalid && !isGhost}
        invalidStepIds={invalidStepIds}
      />
    </motion.div>
  );
}
