"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { WorkflowConnector } from "@/app/components/automation/builder/WorkflowConnector";
import { WorkflowNodeCard } from "@/app/components/automation/builder/WorkflowNodeCard";
import { automationEase } from "@/app/components/automation/automation-ui";
import type { WorkflowNode } from "@/app/components/automation/types";

const ZOOM_MIN = 0.72;
const ZOOM_MAX = 1.2;
const ZOOM_STEP = 0.08;

export function BuilderCanvas({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: WorkflowNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);

  const fitScreen = useCallback(() => setZoom(1), []);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-100/80">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(161 161 170 / 0.45) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.55 }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-zinc-200/90 bg-white/90 p-1 shadow-lg backdrop-blur-md"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: automationEase }}
      >
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums text-zinc-600">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <span className="mx-0.5 h-6 w-px bg-zinc-200" aria-hidden />
        <button
          type="button"
          aria-label="Fit screen"
          onClick={fitScreen}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
        >
          <Maximize2 className="size-3.5" aria-hidden />
          Fit
        </button>
      </motion.div>

      <motion.div
        className="min-h-0 flex-1 overflow-auto px-6 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: automationEase }}
      >
        <motion.div
          className="mx-auto flex w-full max-w-lg flex-col items-center"
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
          {nodes.map((node, index) => (
            <div key={node.id} className="flex w-full flex-col items-center">
              <WorkflowNodeCard
                node={node}
                selected={selectedId === node.id}
                onSelect={() => onSelect(node.id)}
              />
              {index < nodes.length - 1 ? <WorkflowConnector /> : null}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
