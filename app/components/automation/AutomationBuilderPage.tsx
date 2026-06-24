"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActivateFlowPromptDialog } from "@/app/components/automation/ActivateFlowPromptDialog";
import { AutomationExecutionsPanel } from "@/app/components/automation/AutomationExecutionsPanel";
import { BlockSidebar } from "@/app/components/automation/builder/BlockSidebar";
import { BuilderCanvas } from "@/app/components/automation/builder/BuilderCanvas";
import { NodeSettingsPanel } from "@/app/components/automation/builder/NodeSettingsPanel";
import { automationEase } from "@/app/lib/motion";
import { AUTOMATION_BLOCKS } from "@/app/components/automation/mock-data";
import type {
  AutomationListItem,
  AutomationStatus,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/app/components/automation/types";
import {
  mapAutomationToListItem,
  updateAutomation,
} from "@/app/services/automation/automation-api";
import { syncAutomationQueryCache } from "@/app/services/automation/automation-query-cache";
import { useAutomationQuery } from "@/app/hooks/use-automation-query";
import { BuilderShell } from "@/app/components/builder/BuilderShell";
import { toastApiError } from "@/app/lib/toast-api-error";
import {
  getWorkflowNodeInsertIndex,
  hasCronTriggerNode,
  isCronStartingTrigger,
  isManualRunDisabledFlow,
  insertWorkflowNode,
  reorderWorkflowNodes,
} from "@/app/components/automation/workflow-node-order";
import {
  createAutomationConnection,
} from "@/app/services/automation/connection-api";
import type { AutomationConnection } from "@/app/services/automation/types";
import {
  blockKindToNodeType,
  createAutomationNode,
  deleteAutomationNode,
  mapApiNodeToWorkflowNode,
  mapAutomationGraphToWorkflowNodes,
  defaultConfigForBlockKind,
  isTriggerBlockKind,
  updateAutomationNode,
} from "@/app/services/automation/node-api";
import { useFlowNavigationGuard } from "@/app/hooks/use-flow-navigation-guard";
import { isPositiveInt } from "@/app/lib/numbers";
import { validatePaymentReminderSchedule } from "@/app/components/automation/payment-reminder-schedule-validation";

type BuilderTab = "builder" | "runs";

type PendingFlowNavigation =
  | { kind: "href"; href: string }
  | { kind: "tab"; tab: BuilderTab };

const TABS: { id: BuilderTab; label: string }[] = [
  { id: "builder", label: "Flow" },
  { id: "runs", label: "Runs" },
];

function BuilderTabToggle({
  tab,
  onChange,
}: {
  tab: BuilderTab;
  onChange: (next: BuilderTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Automation views"
      className="relative grid w-max min-w-[10.5rem] grid-cols-2 rounded-full border border-zinc-200/80 bg-zinc-100/80 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-zinc-950/[0.05] sm:min-w-[12rem] sm:p-1 xl:min-w-[14rem]"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`relative z-10 cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight transition-colors duration-200 sm:px-6 sm:py-2 sm:text-sm xl:px-7 xl:py-2.5 ${
              active ? "" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="automation-builder-tab-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-black/25"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <motion.span
              className={`relative block ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-800"
              }`}
              animate={{ scale: active ? 1.02 : 1 }}
              transition={{ duration: 0.2, ease: automationEase }}
            >
              {t.label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}

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
  const queryClient = useQueryClient();
  const [automation, setAutomation] = useState<AutomationListItem | null>(null);
  const [status, setStatus] = useState<AutomationStatus>("draft");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab: BuilderTab =
    tabFromUrl === "runs" || tabFromUrl === "activity" ? "runs" : "builder";
  const [tab, setTab] = useState<BuilderTab>(initialTab);
  const [, startTabTransition] = useTransition();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<AutomationConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingNode, setDeletingNode] = useState(false);
  const [savingNode, setSavingNode] = useState(false);
  const addingBlockRef = useRef(false);
  const [activating, setActivating] = useState(false);
  const [automationPublished, setAutomationPublished] = useState(false);
  const [isFlowDirty, setIsFlowDirty] = useState(false);
  const [navPromptOpen, setNavPromptOpen] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingFlowNavigation | null>(
    null,
  );

  const {
    data: remoteAutomation,
    isActive: automationIsActive,
    isPublished: automationIsPublished,
    status: remoteStatus,
    isLoading: nodesLoading,
  } = useAutomationQuery(automationNumericId);

  useEffect(() => {
    setIsFlowDirty(false);
  }, [automationNumericId]);

  useEffect(() => {
    if (!isPositiveInt(automationNumericId)) {
      setAutomation(null);
      setNodes([]);
      setConnections([]);
      setSelectedId(null);
      setAutomationPublished(false);
      return;
    }

    if (!remoteAutomation || isFlowDirty) {
      return;
    }

    const mapped = mapAutomationToListItem(remoteAutomation);
    setAutomation(mapped);
    setStatus(remoteStatus);
    setAutomationPublished(automationIsPublished);
    const list = mapAutomationGraphToWorkflowNodes(
      remoteAutomation.nodes ?? [],
      remoteAutomation.connections ?? [],
    );
    setNodes(list);
    setConnections(remoteAutomation.connections ?? []);
    setSelectedId((current) => {
      if (current && list.some((n) => n.id === current)) {
        return current;
      }
      return list[0]?.id ?? null;
    });
  }, [automationNumericId, remoteAutomation, remoteStatus, automationIsPublished, isFlowDirty]);

  useEffect(() => {
    const next: BuilderTab | null =
      tabFromUrl === "runs" || tabFromUrl === "activity"
        ? "runs"
        : tabFromUrl === "builder"
          ? "builder"
          : null;
    if (next) {
      setTab(next);
    }
  }, [tabFromUrl]);

  const automationsListHref =
    listHref ?? `/restaurant/${restaurantId}/dashboard/automations`;

  const automationActive = automationIsActive;

  const cronStartsFlow = useMemo(
    () => isCronStartingTrigger(nodes),
    [nodes],
  );

  const manualRunDisabled = useMemo(
    () => isManualRunDisabledFlow(nodes),
    [nodes],
  );

  const shouldBlockFlowNavigation =
    tab === "builder" && isFlowDirty && !automationPublished;

  const applyBuilderTab = useCallback(
    (next: BuilderTab) => {
      setTab(next);
      startTabTransition(() => {
        const q = new URLSearchParams(searchParams.toString());
        q.set("tab", next);
        if (funnelId != null && funnelId >= 1) {
          q.set("funnelId", String(funnelId));
        }
        router.replace(`${pathname}?${q.toString()}`);
      });
    },
    [funnelId, pathname, router, searchParams],
  );

  const setBuilderTab = useCallback(
    (next: BuilderTab) => {
      if (tab === "builder" && next !== "builder" && shouldBlockFlowNavigation) {
        setPendingNav({ kind: "tab", tab: next });
        setNavPromptOpen(true);
        return;
      }
      applyBuilderTab(next);
    },
    [applyBuilderTab, shouldBlockFlowNavigation, tab],
  );

  const completePendingNavigation = useCallback(() => {
    if (pendingNav == null) return;

    if (pendingNav.kind === "href") {
      router.push(pendingNav.href);
    } else {
      applyBuilderTab(pendingNav.tab);
    }

    setPendingNav(null);
    setNavPromptOpen(false);
  }, [applyBuilderTab, pendingNav, router]);

  useFlowNavigationGuard(
    shouldBlockFlowNavigation,
    useCallback((href: string) => {
      setPendingNav({ kind: "href", href });
      setNavPromptOpen(true);
    }, []),
  );

  useEffect(() => {
    if (automationPublished && navPromptOpen) {
      setNavPromptOpen(false);
      setPendingNav(null);
    }
  }, [automationPublished, navPromptOpen]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  useEffect(() => {
    if (
      !selectedNode ||
      !isTriggerBlockKind(selectedNode.kind) ||
      selectedNode.kind === "cron_trigger"
    ) {
      return;
    }
    const defaultConfig = defaultConfigForBlockKind(selectedNode.kind);
    const expectedTrigger = defaultConfig.trigger;
    if (selectedNode.config?.trigger === expectedTrigger) {
      return;
    }

    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNode.id ? { ...n, config: defaultConfig } : n,
      ),
    );
  }, [
    selectedNode?.id,
    selectedNode?.kind,
    selectedNode?.config?.trigger,
  ]);

  const syncDirtyNodesToServer = useCallback(async () => {
    for (let order = 0; order < nodes.length; order++) {
      const node = nodes[order];
      if (node.numericId == null) continue;
      await updateAutomationNode(node.numericId, {
        order,
        config: node.config,
      });
    }
  }, [nodes]);

  const handleActivate = useCallback(async (): Promise<boolean> => {
    if (!isPositiveInt(automationNumericId)) {
      toast.error("Open a saved automation before activating.");
      return false;
    }

    const scheduleValidation = validatePaymentReminderSchedule(
      nodes,
      remoteAutomation?.purpose,
    );
    if (!scheduleValidation.ok) {
      toast.error(scheduleValidation.message);
      return false;
    }

    setActivating(true);
    try {
      if (isFlowDirty) {
        await syncDirtyNodesToServer();
      }

      const updated = await updateAutomation(automationNumericId, {
        isActive: true,
        published: true,
      });
      syncAutomationQueryCache(queryClient, updated);
      setAutomation(mapAutomationToListItem(updated));
      setStatus("active");
      setAutomationPublished(updated.published === true);
      setIsFlowDirty(false);
      toast.success("Automation activated.");
      return true;
    } catch (err) {
      toastApiError(err, "Could not activate automation.");
      return false;
    } finally {
      setActivating(false);
    }
  }, [
    automationNumericId,
    isFlowDirty,
    nodes,
    queryClient,
    remoteAutomation?.purpose,
    syncDirtyNodesToServer,
  ]);

  const handleDeactivate = useCallback(async () => {
    if (!isPositiveInt(automationNumericId)) {
      toast.error("Open a saved automation before deactivating.");
      return;
    }

    setActivating(true);
    try {
      const updated = await updateAutomation(automationNumericId, {
        isActive: false,
        published: false,
      });
      syncAutomationQueryCache(queryClient, updated);
      setAutomation(mapAutomationToListItem(updated));
      setStatus("draft");
      setAutomationPublished(false);
      toast.success("Automation deactivated.");
    } catch (err) {
      toastApiError(err, "Could not deactivate automation.");
    } finally {
      setActivating(false);
    }
  }, [automationNumericId, queryClient]);

  const handleDialogActivate = useCallback(async () => {
    const ok = await handleActivate();
    if (ok) {
      completePendingNavigation();
    }
  }, [completePendingNavigation, handleActivate]);

  const closeNavPrompt = useCallback(() => {
    setPendingNav(null);
    setNavPromptOpen(false);
  }, []);

  const onAddBlock = useCallback(
    async (blockId: WorkflowNodeKind) => {
      const block = AUTOMATION_BLOCKS.find((b) => b.id === blockId);
      if (!block) return;

      if (!isPositiveInt(automationNumericId)) {
        toast.error("Open a saved automation before adding nodes.");
        return;
      }

      if (blockId === "cron_trigger" && hasCronTriggerNode(nodes)) {
        toast.error("This flow already has a Cron Job trigger at the start.");
        return;
      }

      if (addingBlockRef.current) return;

      const defaultConfig = defaultConfigForBlockKind(blockId);
      const isCronTrigger = blockId === "cron_trigger";
      const insertIndex = getWorkflowNodeInsertIndex(nodes, blockId);
      const order = insertIndex;
      const previousNode = isCronTrigger ? null : nodes[nodes.length - 1];
      const firstNode = isCronTrigger && nodes.length > 0 ? nodes[0] : null;
      const tempId = `local-${blockId}-${Date.now()}`;
      const optimisticNode: WorkflowNode = {
        id: tempId,
        automationId: automationNumericId,
        kind: blockId,
        label: block.label,
        config: defaultConfig,
      };

      addingBlockRef.current = true;
      setNodes((prev) => insertWorkflowNode(prev, optimisticNode));
      setSelectedId(tempId);
      setIsFlowDirty(true);

      try {
        const created = await createAutomationNode({
          automationId: automationNumericId,
          type: blockKindToNodeType(blockId),
          order,
          config: defaultConfig,
          positionX: 100,
          positionY: 200 + order * 120,
        });

        const workflowNode: WorkflowNode = {
          ...mapApiNodeToWorkflowNode(created),
          kind: blockId,
          label: block.label,
          config: defaultConfig,
        };

        let newConnection: AutomationConnection | null = null;
        if (isCronTrigger) {
          if (
            firstNode?.numericId != null &&
            workflowNode.numericId != null
          ) {
            newConnection = await createAutomationConnection({
              automationId: automationNumericId,
              sourceNodeId: workflowNode.numericId,
              targetNodeId: firstNode.numericId,
            });
          }
        } else if (
          previousNode?.numericId != null &&
          workflowNode.numericId != null
        ) {
          newConnection = await createAutomationConnection({
            automationId: automationNumericId,
            sourceNodeId: previousNode.numericId,
            targetNodeId: workflowNode.numericId,
          });
        }

        setNodes((prev) =>
          insertWorkflowNode(
            prev.filter((node) => node.id !== tempId),
            workflowNode,
          ),
        );
        if (newConnection) {
          setConnections((prev) => [...prev, newConnection]);
        }
        setSelectedId(workflowNode.id);
        toast.success("Step added.");
      } catch (err) {
        setNodes((prev) => prev.filter((node) => node.id !== tempId));
        setSelectedId((current) => (current === tempId ? null : current));
        toastApiError(err, "Could not add step.");
      } finally {
        addingBlockRef.current = false;
      }
    },
    [automationNumericId, nodes],
  );

  const onUpdateNode = useCallback(
    async (config: Record<string, unknown>) => {
      if (!selectedNode) return;

      const scheduleValidation = validatePaymentReminderSchedule(
        nodes,
        remoteAutomation?.purpose,
        { nodeId: selectedNode.id, config },
      );
      if (!scheduleValidation.ok) {
        toast.error(scheduleValidation.message);
        return;
      }

      const nodeId = selectedNode.id;
      const numericId = selectedNode.numericId;
      setSavingNode(true);

      try {
        if (numericId != null) {
          const order = nodes.findIndex((n) => n.id === nodeId);
          await updateAutomationNode(numericId, {
            order: order >= 0 ? order : 0,
            config,
          });
        }

        setNodes((prev) =>
          prev.map((n) => (n.id === nodeId ? { ...n, config } : n)),
        );
        if (numericId == null) {
          setIsFlowDirty(true);
        }
        toast.success(
          numericId != null ? "Step saved." : "Step updated locally.",
        );
      } catch (err) {
        toastApiError(err, "Could not save step.");
      } finally {
        setSavingNode(false);
      }
    },
    [nodes, remoteAutomation?.purpose, selectedNode],
  );

  const onDeleteNode = useCallback(async () => {
    if (!selectedNode) return;

    const nodeId = selectedNode.id;
    const numericId = selectedNode.numericId;
    setDeletingNode(true);

    try {
      if (numericId != null) {
        await deleteAutomationNode(numericId);
      }

      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      if (numericId != null) {
        setConnections((prev) =>
          prev.filter(
            (c) =>
              c.sourceNodeId !== numericId && c.targetNodeId !== numericId,
          ),
        );
      }
      setSelectedId(null);
      setIsFlowDirty(true);
      toast.success("Step removed.");
    } catch (err) {
      toastApiError(err, "Could not delete step.");
    } finally {
      setDeletingNode(false);
    }
  }, [selectedNode]);

  const onReorderNodes = useCallback((fromIndex: number, toIndex: number) => {
    let changed = false;
    setNodes((prev) => {
      const next = reorderWorkflowNodes(prev, fromIndex, toIndex);
      changed = next !== prev;
      return next;
    });
    if (changed) {
      setIsFlowDirty(true);
    }
  }, []);

  const persistentHeader = (
    <header className="relative shrink-0 border-b border-zinc-200/70 bg-gradient-to-b from-white via-white to-zinc-50/80 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] sm:px-4 sm:py-3 lg:px-6 lg:py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        <BuilderTabToggle tab={tab} onChange={setBuilderTab} />

        {tab === "builder" ? (
            <button
              type="button"
              onClick={() =>
                void (automationActive ? handleDeactivate() : handleActivate())
              }
              disabled={activating}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
                automationActive
                  ? "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
                  : "bg-zinc-950 text-white hover:bg-black"
              }`}
            >
              {activating ? (
                <Loader2
                  className={`size-3.5 animate-spin sm:size-4 ${automationActive ? "text-zinc-900" : "text-white"}`}
                  aria-hidden
                />
              ) : (
                <Zap
                  className={`size-3.5 sm:size-4 ${automationActive ? "text-zinc-900" : "text-white"}`}
                  aria-hidden
                />
              )}
              {activating
                ? automationActive
                  ? "Deactivating…"
                  : "Activating…"
                : automationActive
                  ? "Deactivate"
                  : "Activate"}
            </button>
        ) : null}
      </div>
    </header>
  );

  return (
    <motion.div
      className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden bg-[#f0f0f2]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: automationEase }}
    >
      {persistentHeader}
      <AnimatePresence mode="wait">
      {tab === "builder" ? (
        <motion.div
          key="builder"
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: automationEase }}
        >
          <BuilderShell
            sidebar={<BlockSidebar onAddBlock={(id) => void onAddBlock(id)} />}
            canvas={
              <BuilderCanvas
                nodes={nodes}
                loading={nodesLoading}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDropBlock={(id) => void onAddBlock(id)}
                onReorderNodes={onReorderNodes}
              />
            }
            settingsPanel={
              <NodeSettingsPanel
                node={selectedNode}
                nodes={nodes}
                automationPurpose={remoteAutomation?.purpose}
                onSave={onUpdateNode}
                onDelete={onDeleteNode}
                saving={savingNode}
                deleting={deletingNode}
              />
            }
          />
        </motion.div>
      ) : automationNumericId == null ? (
        <motion.div
          key="not-found"
          className="flex flex-1 items-center justify-center px-4 py-12 text-center text-sm text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: automationEase }}
        >
          <p>
            Automation not found.{" "}
            <Link
              href={automationsListHref}
              className="font-semibold text-zinc-900 underline"
            >
              Back to automations
            </Link>
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="runs"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: automationEase }}
        >
          <AutomationExecutionsPanel
            automationId={automationNumericId}
            automationActive={automationActive}
            showRunButton={!manualRunDisabled}
            showPauseButton={cronStartsFlow}
          />
        </motion.div>
      )}
      </AnimatePresence>

      <ActivateFlowPromptDialog
        open={navPromptOpen && !automationPublished}
        isLoading={activating}
        onStay={closeNavPrompt}
        onActivate={() => void handleDialogActivate()}
      />
    </motion.div>
  );
}
