"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AutomationActivityPanel } from "@/app/components/automation/AutomationActivityPanel";
import { AutomationExecutionsPanel } from "@/app/components/automation/AutomationExecutionsPanel";
import { BlockSidebar } from "@/app/components/automation/builder/BlockSidebar";
import { BuilderCanvas } from "@/app/components/automation/builder/BuilderCanvas";
import { NodeSettingsPanel } from "@/app/components/automation/builder/NodeSettingsPanel";
import {
  automationEase,
  statusBadgeClass,
} from "@/app/components/automation/automation-ui";
import { AUTOMATION_BLOCKS } from "@/app/components/automation/mock-data";
import type {
  AutomationListItem,
  AutomationStatus,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/app/components/automation/types";
import {
  getAutomationById,
  mapAutomationToListItem,
} from "@/app/services/automation/automation-api";
import { BuilderShell } from "@/app/components/builder/BuilderShell";
import { toastApiError } from "@/app/lib/toast-api-error";
import { createAutomationConnection } from "@/app/services/automation/connection-api";
import {
  blockKindToNodeType,
  createAutomationNode,
  deleteAutomationNode,
  mapApiNodeToWorkflowNode,
  mapAutomationGraphToWorkflowNodes,
  SIGNUP_TRIGGER_DEFAULT_CONFIG,
  updateAutomationNode,
} from "@/app/services/automation/node-api";
import { isPositiveInt } from "@/app/lib/numbers";

type BuilderTab = "builder" | "runs" | "activity";

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

const TABS: { id: BuilderTab; label: string }[] = [
  { id: "builder", label: "Flow" },
  { id: "runs", label: "Runs" },
  { id: "activity", label: "Activity" },
];

export function AutomationBuilderPage({
  restaurantId,
  automationId,
  automationNumericId,
  funnelId,
  listHref,
}: {
  restaurantId: number;
  automationId: string;
  automationNumericId: number | null;
  funnelId?: number | null;
  listHref?: string;
}) {
  const [automation, setAutomation] = useState<AutomationListItem | null>(null);
  const title = automation?.name ?? "Automation";
  const [status, setStatus] = useState<AutomationStatus>("draft");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab: BuilderTab =
    tabFromUrl === "runs" || tabFromUrl === "activity" || tabFromUrl === "builder"
      ? tabFromUrl
      : "builder";
  const [tab, setTab] = useState<BuilderTab>(initialTab);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [deletingNode, setDeletingNode] = useState(false);
  const [savingNode, setSavingNode] = useState(false);

  const loadAutomation = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!isPositiveInt(automationNumericId)) {
        setAutomation(null);
        setNodes([]);
        setSelectedId(null);
        return;
      }
      if (!options?.silent) {
        setNodesLoading(true);
      }
      try {
        const remote = await getAutomationById(automationNumericId);
        const mapped = mapAutomationToListItem(remote);
        setAutomation(mapped);
        setStatus(mapped.status);
        const list = mapAutomationGraphToWorkflowNodes(
          remote.nodes ?? [],
          remote.connections ?? [],
        );
        setNodes(list);
        setSelectedId((current) => {
          if (current && list.some((n) => n.id === current)) {
            return current;
          }
          return list[0]?.id ?? null;
        });
      } catch {
        if (!options?.silent) {
          setAutomation(null);
          setNodes([]);
          setSelectedId(null);
        }
      } finally {
        if (!options?.silent) {
          setNodesLoading(false);
        }
      }
    },
    [automationNumericId],
  );

  useEffect(() => {
    void loadAutomation();
  }, [loadAutomation]);

  useEffect(() => {
    const next =
      tabFromUrl === "runs" || tabFromUrl === "activity" || tabFromUrl === "builder"
        ? tabFromUrl
        : null;
    if (next && next !== tab) {
      setTab(next);
    }
  }, [tabFromUrl, tab]);

  const automationsListHref =
    listHref ?? `/restaurant/${restaurantId}/dashboard/automations`;

  const setBuilderTab = useCallback(
    (next: BuilderTab) => {
      setTab(next);
      const q = new URLSearchParams(searchParams.toString());
      q.set("tab", next);
      if (funnelId != null && funnelId >= 1) {
        q.set("funnelId", String(funnelId));
      }
      router.replace(`${pathname}?${q.toString()}`);
    },
    [funnelId, pathname, router, searchParams],
  );

  const automationActive =
    status === "active" || automation?.status === "active";

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  useEffect(() => {
    if (selectedNode?.kind !== "signup_trigger" || selectedNode.numericId == null) {
      return;
    }
    if (selectedNode.config?.trigger === "signup") {
      return;
    }

    let cancelled = false;
    const nodeId = selectedNode.numericId;

    (async () => {
      setSavingNode(true);
      try {
        const updated = await updateAutomationNode(nodeId, {
          config: SIGNUP_TRIGGER_DEFAULT_CONFIG,
        });
        if (cancelled) return;
        const mapped = {
          ...mapApiNodeToWorkflowNode(updated),
          config:
            updated.config && Object.keys(updated.config).length > 0
              ? updated.config
              : SIGNUP_TRIGGER_DEFAULT_CONFIG,
        };
        setNodes((prev) =>
          prev.map((n) => (n.numericId === updated.id ? mapped : n)),
        );
      } catch (err) {
        if (cancelled) return;
        toastApiError(err, "Could not save signup trigger settings.");
      } finally {
        if (!cancelled) setSavingNode(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedNode?.id,
    selectedNode?.kind,
    selectedNode?.numericId,
    selectedNode?.config?.trigger,
  ]);

  const stats = useMemo(
    () => ({
      nodeCount: nodes.length,
      estimated: estimateWorkflowMinutes(nodes),
      customers: automation?.customersEntered ?? 0,
    }),
    [nodes, automation?.customersEntered],
  );

  const onAddBlock = useCallback(
    async (blockId: WorkflowNodeKind) => {
      const block = AUTOMATION_BLOCKS.find((b) => b.id === blockId);
      if (!block) return;

      if (!isPositiveInt(automationNumericId)) {
        toast.error("Open a saved automation before adding nodes.");
        return;
      }

      const order = nodes.length;
      const previousNode = nodes[nodes.length - 1] ?? null;
      try {
        const created = await createAutomationNode({
          automationId: automationNumericId,
          type: blockKindToNodeType(blockId),
          order,
          config: {},
          positionX: 100,
          positionY: 200 + order * 120,
        });
        const next = mapApiNodeToWorkflowNode(created);
        setNodes((prev) => [
          ...prev.filter((n) => n.numericId !== created.id),
          next,
        ]);
        setSelectedId(next.id);

        if (previousNode?.numericId != null) {
          try {
            await createAutomationConnection({
              automationId: automationNumericId,
              sourceNodeId: previousNode.numericId,
              targetNodeId: created.id,
            });
          } catch (connErr) {
            toastApiError(
              connErr,
              "Node saved, but could not link to the previous step.",
            );
          }
        }

        void loadAutomation({ silent: true });
      } catch (err) {
        toastApiError(err, "Could not create node.");
      }
    },
    [automationNumericId, nodes, loadAutomation],
  );

  const onUpdateNode = useCallback(
    async (config: Record<string, unknown>) => {
      if (!selectedNode?.numericId) {
        toast.error("This step is not saved yet.");
        return;
      }

      setSavingNode(true);
      try {
        const updated = await updateAutomationNode(selectedNode.numericId, {
          config,
        });
        const savedConfig =
          updated.config && Object.keys(updated.config).length > 0
            ? updated.config
            : config;
        const mapped = {
          ...mapApiNodeToWorkflowNode(updated),
          config: savedConfig,
        };
        setNodes((prev) =>
          prev.map((n) => (n.numericId === updated.id ? mapped : n)),
        );
        toast.success("Step updated.");
      } catch (err) {
        toastApiError(err, "Could not update step.");
      } finally {
        setSavingNode(false);
      }
    },
    [selectedNode],
  );

  const onDeleteNode = useCallback(async () => {
    if (!selectedNode) return;

    const nodeId = selectedNode.numericId;
    if (nodeId == null) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id));
      setSelectedId(null);
      return;
    }

    setDeletingNode(true);
    try {
      await deleteAutomationNode(nodeId);
      setNodes((prev) => prev.filter((n) => n.numericId !== nodeId));
      setSelectedId(null);
      toast.success("Step removed.");
      void loadAutomation({ silent: true });
    } catch (err) {
      toastApiError(err, "Could not delete step.");
    } finally {
      setDeletingNode(false);
    }
  }, [selectedNode, loadAutomation]);

  const pageHeader = (
    <>
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 shrink">
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
            <span className="truncate font-semibold text-zinc-900">{title}</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(status)}`}
            >
              {status}
            </span>
          </div>
        </div>

        {tab === "builder" ? (
          <div className="flex flex-wrap gap-2">
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
          </div>
        ) : null}
      </div>

      <div className="mt-4 min-w-0 -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-0.5 sm:-mx-6 sm:px-6">
        <div className="flex w-max min-w-full gap-1 rounded-xl border border-zinc-200/90 bg-zinc-100/80 p-1 sm:w-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBuilderTab(t.id)}
              className={`shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden bg-zinc-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: automationEase }}
    >
      {tab === "builder" ? (
        <>
          <header className="shrink-0 border-b border-zinc-200/90 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
            {pageHeader}
          </header>
          <BuilderShell
            sidebar={<BlockSidebar onAddBlock={onAddBlock} />}
            canvas={
              <BuilderCanvas
                nodes={nodes}
                loading={nodesLoading}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            }
            settingsPanel={
              <NodeSettingsPanel
                node={selectedNode}
                onSave={onUpdateNode}
                onDelete={onDeleteNode}
                saving={savingNode}
                deleting={deletingNode}
              />
            }
            overlay={
              <motion.aside
                className="pointer-events-none absolute bottom-6 right-[calc(300px+1.5rem)] z-30 max-lg:right-6 lg:right-[calc(320px+1.5rem)]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ease: automationEase }}
              >
                <div className="pointer-events-auto rounded-2xl border border-zinc-200/90 bg-white/90 p-4 shadow-xl backdrop-blur-md">
                  <dl className="grid gap-3 text-xs sm:grid-cols-3 sm:gap-6">
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                        Total nodes
                      </dt>
                      <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
                        {stats.nodeCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                        Est. time
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-zinc-900">
                        {stats.estimated}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-zinc-500">
                        In workflow
                      </dt>
                      <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-900">
                        {stats.customers}
                      </dd>
                    </div>
                  </dl>
                </div>
              </motion.aside>
            }
          />
        </>
      ) : automationNumericId == null ? (
        <div className="flex flex-1 items-center justify-center px-4 py-12 text-center text-sm text-zinc-600">
          <p>
            Automation not found.{" "}
            <Link
              href={automationsListHref}
              className="font-semibold text-zinc-900 underline"
            >
              Back to automations
            </Link>
          </p>
        </div>
      ) : (
        <div className="min-h-0 min-w-0 flex-1 overflow-auto">
          <header className="border-b border-zinc-200/90 bg-white px-4 py-3 sm:px-6">
            {pageHeader}
          </header>
          {tab === "runs" ? (
            <AutomationExecutionsPanel
              automationId={automationNumericId}
              automationActive={automationActive}
            />
          ) : (
            <AutomationActivityPanel
              automationId={automationNumericId}
              automationActive={automationActive}
              onRunStarted={() => setBuilderTab("runs")}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}
