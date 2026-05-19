"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { BlockSidebar } from "@/app/components/automation/builder/BlockSidebar";
import { BuilderCanvas } from "@/app/components/automation/builder/BuilderCanvas";
import { NodeSettingsPanel } from "@/app/components/automation/builder/NodeSettingsPanel";
import {
  automationEase,
  statusBadgeClass,
} from "@/app/components/automation/automation-ui";
import {
  AUTOMATION_BLOCKS,
  DEFAULT_WORKFLOW_NODES,
  getAutomationById,
} from "@/app/components/automation/mock-data";
import type {
  AutomationStatus,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/app/components/automation/types";

function estimateWorkflowMinutes(nodes: WorkflowNode[]): string {
  let mins = 0;
  for (const n of nodes) {
    if (n.kind === "wait" || n.kind === "delay") mins += 30;
    else if (n.kind === "send_email" || n.kind === "send_sms") mins += 2;
    else mins += 1;
  }
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

export function AutomationBuilderPage({
  restaurantId,
  automationId,
  listHref,
}: {
  restaurantId: number;
  automationId: string;
  listHref?: string;
}) {
  const automation = getAutomationById(automationId);
  const title = automation?.name ?? "New automation";
  const [status, setStatus] = useState<AutomationStatus>(
    automation?.status ?? "draft",
  );
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEFAULT_WORKFLOW_NODES);
  const [selectedId, setSelectedId] = useState<string | null>(
    DEFAULT_WORKFLOW_NODES[1]?.id ?? null,
  );

  const automationsListHref =
    listHref ?? `/restaurant/${restaurantId}/dashboard/automations`;

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const stats = useMemo(
    () => ({
      nodeCount: nodes.length,
      estimated: estimateWorkflowMinutes(nodes),
      customers: automation?.customersEntered ?? 0,
    }),
    [nodes, automation?.customersEntered],
  );

  const onAddBlock = useCallback((blockId: WorkflowNodeKind) => {
    const block = AUTOMATION_BLOCKS.find((b) => b.id === blockId);
    if (!block) return;
    const id = `n-${Date.now()}`;
    const next: WorkflowNode = { id, kind: blockId, label: block.label };
    setNodes((prev) => [...prev, next]);
    setSelectedId(id);
  }, []);

  return (
    <motion.div
      className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden bg-zinc-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: automationEase }}
    >
      <header className="shrink-0 border-b border-zinc-200/90 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav
              className="flex flex-wrap items-center gap-1 text-xs font-medium text-zinc-500"
              aria-label="Breadcrumb"
            >
              <Link
                href={automationsListHref}
                className="transition hover:text-zinc-900"
              >
                Automations
              </Link>
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate font-semibold text-zinc-900">
                {title}
              </span>
            </nav>
            <motion.div
              className="mt-2 flex flex-wrap items-center gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, ease: automationEase }}
            >
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(status)}`}
              >
                {status}
              </span>
            </motion.div>
          </div>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, ease: automationEase }}
          >
            <button
              type="button"
              onClick={() => setStatus("draft")}
              className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => setStatus("published")}
              className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={() => setStatus("active")}
              className="cursor-pointer rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              Activate
            </button>
          </motion.div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <BlockSidebar onAddBlock={onAddBlock} />
        <BuilderCanvas
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <NodeSettingsPanel node={selectedNode} />

        <motion.aside
          className="pointer-events-none absolute bottom-6 right-[calc(300px+1.5rem)] z-30 max-lg:right-6 lg:right-[calc(320px+1.5rem)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ease: automationEase }}
        >
          <div className="pointer-events-auto rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-xl backdrop-blur-md">
            <dl className="grid gap-3 text-xs sm:grid-cols-3 sm:gap-6">
              <motion.div>
                <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                  Total nodes
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
                  {stats.nodeCount}
                </dd>
              </motion.div>
              <motion.div>
                <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                  Est. time
                </dt>
                <dd className="mt-1 text-lg font-bold text-zinc-900">
                  {stats.estimated}
                </dd>
              </motion.div>
              <motion.div>
                <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                  In workflow
                </dt>
                <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
                  {stats.customers}
                </dd>
              </motion.div>
            </dl>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
