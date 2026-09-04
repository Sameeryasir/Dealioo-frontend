"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Pencil } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActivateFlowPromptDialog } from "@/app/components/automation/ActivateFlowPromptDialog";
import { DeactivateToEditDialog } from "@/app/components/automation/DeactivateToEditDialog";
import { EditAutomationDetailsDialog } from "@/app/components/automation/EditAutomationDetailsDialog";
import { AutomationExecutionsPanel } from "@/app/components/automation/AutomationExecutionsPanel";
import { BlockSidebar } from "@/app/components/automation/builder/BlockSidebar";
import { BuilderCanvas } from "@/app/components/automation/builder/BuilderCanvas";
import { normalizePaymentReminderWorkflowNodes } from "@/app/components/automation/builder/bundled-actions";
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
  activateAutomation,
  deactivateAutomation,
  updateAutomation,
} from "@/app/services/automation/automation-api";
import { syncAutomationQueryCache, invalidateAutomationQueries } from "@/app/services/automation/automation-query-cache";
import { automationQueryKeys } from "@/app/services/automation/automation-query-keys";
import { useAutomationQuery } from "@/app/hooks/use-automation-query";
import { BuilderShell } from "@/app/components/builder/BuilderShell";
import {
  AutomationBuilderActivateButton,
  AutomationBuilderTabBar,
  type AutomationBuilderTab,
} from "@/app/components/automation/AutomationBuilderTopbar";
import { toastApiError } from "@/app/lib/toast-api-error";
import {
  canAddTriggerBlock,
  getWorkflowNodeInsertIndex,
  hasTriggerNode,
  isCronStartingTrigger,
  isManualRunDisabledFlow,
  isPaymentStartingTrigger,
  isSignupStartingTrigger,
  isTriggerWorkflowKind,
  insertWorkflowNode,
  reorderWorkflowNodes,
} from "@/app/components/automation/workflow-node-order";
import {
  createAutomationConnection,
  deleteAutomationConnection,
  syncAutomationConnections,
} from "@/app/services/automation/connection-api";
import type { AutomationConnection } from "@/app/services/automation/types";
import { isAutomationStatusResponse } from "@/app/services/automation/types";
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
import { validateWorkflowForActivation } from "@/app/components/automation/builder/workflow-activation-validation";
import {
  resolveBranchConfigForNewNode,
  getNodeBranchPlacement,
  findNextMainFlowNode,
  findNextNodeInBranch,
  findPreviousMainFlowNode,
  findPreviousNodeInBranch,
  isParallelSplitWorkflowNode,
  nodeMatchesBranchTarget,
  parseParallelBranchesFromConfig,
  resolveClickAddBranchTarget,
  buildDesiredAutomationConnectionPairs,
  type WorkflowBranchTarget,
  type WorkflowDropPlacement,
} from "@/app/components/automation/builder/workflow-branch-context";

const ACTIVATION_INVALID_BLINK_MS = 3500;

async function ensureMissingDesiredConnections(
  automationId: number,
  workflowNodes: WorkflowNode[],
  existingConnections: AutomationConnection[],
): Promise<AutomationConnection[]> {
  const desiredPairs = buildDesiredAutomationConnectionPairs(workflowNodes);
  const existingByEndpoint = new Map(
    existingConnections.map((connection) => [
      `${connection.sourceNodeId}->${connection.targetNodeId}`,
      connection,
    ]),
  );
  const needsSync = desiredPairs.some((pair) => {
    const current = existingByEndpoint.get(
      `${pair.sourceNodeId}->${pair.targetNodeId}`,
    );
    if (!current) {
      return true;
    }
    const desiredBranch =
      typeof pair.branch === "string" && pair.branch.trim()
        ? pair.branch.trim().toUpperCase()
        : null;
    const currentBranch =
      String(current.branch ?? "")
        .trim()
        .toUpperCase() || null;
    return desiredBranch !== currentBranch;
  });
  if (!needsSync) {
    return [];
  }

  const synced = await syncAutomationConnections({
    automationId,
    pairs: desiredPairs,
    pruneStale: false,
  });
  const beforeKeys = new Set(
    existingConnections.map(
      (connection) =>
        `${connection.sourceNodeId}->${connection.targetNodeId}:${String(connection.branch ?? "").trim().toUpperCase()}`,
    ),
  );
  return synced.filter(
    (connection) =>
      !beforeKeys.has(
        `${connection.sourceNodeId}->${connection.targetNodeId}:${String(connection.branch ?? "").trim().toUpperCase()}`,
      ),
  );
}

async function syncDesiredAutomationConnections(
  automationId: number,
  workflowNodes: WorkflowNode[],
  _existingConnections: AutomationConnection[],
): Promise<AutomationConnection[]> {
  const desiredPairs = buildDesiredAutomationConnectionPairs(workflowNodes);
  return syncAutomationConnections({
    automationId,
    pairs: desiredPairs,
    pruneStale: true,
  });
}

type BuilderTab = AutomationBuilderTab;

type PendingFlowNavigation =
  | { kind: "href"; href: string }
  | { kind: "tab"; tab: BuilderTab };

export function AutomationBuilderPage({
  businessId,
  automationId,
  automationNumericId,
  funnelId,
  listHref,
}: {
  businessId: number;
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
  const [activeBranchTarget, setActiveBranchTarget] =
    useState<WorkflowBranchTarget | null>(null);
  const [deletingNode, setDeletingNode] = useState(false);
  const [savingNode, setSavingNode] = useState(false);
  const addingBlockRef = useRef(false);
  const [activating, setActivating] = useState(false);
  const [automationPublished, setAutomationPublished] = useState(false);
  const [isFlowDirty, setIsFlowDirty] = useState(false);
  const [hasUnsavedStepSettings, setHasUnsavedStepSettings] = useState(false);
  const [invalidNodeIds, setInvalidNodeIds] = useState<string[]>([]);
  const [invalidStepIds, setInvalidStepIds] = useState<string[]>([]);
  const invalidBlinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const settingsSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const [navPromptOpen, setNavPromptOpen] = useState(false);
  const [deactivatePromptOpen, setDeactivatePromptOpen] = useState(false);
  const [detailsEditOpen, setDetailsEditOpen] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingFlowNavigation | null>(
    null,
  );
  const [topbarCenterHost, setTopbarCenterHost] = useState<HTMLElement | null>(
    null,
  );
  const [topbarActionsHost, setTopbarActionsHost] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    setTopbarCenterHost(
      document.getElementById("automation-builder-topbar-center-host"),
    );
    setTopbarActionsHost(
      document.getElementById("automation-builder-topbar-actions-host"),
    );
  }, []);

  const {
    data: remoteAutomation,
    isActive: automationIsActive,
    isPublished: automationIsPublished,
    status: remoteStatus,
    isLoading: nodesLoading,
    refetch: refetchAutomation,
  } = useAutomationQuery(automationNumericId);

  const bootstrapping = searchParams.get("bootstrapping") === "1";

  useEffect(() => {
    if (!bootstrapping || !isPositiveInt(automationNumericId)) {
      return;
    }

    if ((remoteAutomation?.nodes?.length ?? 0) > 0) {
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("bootstrapping")) {
        params.delete("bootstrapping");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      }
      return;
    }

    const intervalId = window.setInterval(() => {
      void refetchAutomation();
    }, 400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    automationNumericId,
    bootstrapping,
    pathname,
    refetchAutomation,
    remoteAutomation?.nodes?.length,
    router,
    searchParams,
  ]);

  useEffect(() => {
    setIsFlowDirty(false);
    setHasUnsavedStepSettings(false);
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
    setAutomationPublished(automationIsPublished === true);
    const list = normalizePaymentReminderWorkflowNodes(
      mapAutomationGraphToWorkflowNodes(
        remoteAutomation.nodes ?? [],
        remoteAutomation.connections ?? [],
      ),
      remoteAutomation.purpose,
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
    listHref ?? `/business/${businessId}/dashboard/automations`;

  const automationActive = automationIsActive === true;

  const showDeactivatePrompt = useCallback(() => {
    setDeactivatePromptOpen(true);
  }, []);

  const guardEdit = useCallback((): boolean => {
    if (!automationActive) {
      return true;
    }
    showDeactivatePrompt();
    return false;
  }, [automationActive, showDeactivatePrompt]);

  const closeDeactivatePrompt = useCallback(() => {
    setDeactivatePromptOpen(false);
  }, []);

  const cronStartsFlow = useMemo(
    () => isCronStartingTrigger(nodes),
    [nodes],
  );

  const manualRunDisabled = useMemo(
    () => isManualRunDisabledFlow(nodes),
    [nodes],
  );

  const autoRunHint = useMemo(() => {
    if (isPaymentStartingTrigger(nodes)) {
      return "This flow runs automatically when a guest completes payment.";
    }
    if (isSignupStartingTrigger(nodes)) {
      return "This flow runs automatically when guests sign up on the funnel.";
    }
    return "This flow runs automatically.";
  }, [nodes]);

  const hasUnsavedBuilderChanges = isFlowDirty || hasUnsavedStepSettings;

  const shouldBlockFlowNavigation =
    tab === "builder" &&
    hasUnsavedBuilderChanges &&
    !automationPublished &&
    automationActive;

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
      automationActive ||
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
    automationActive,
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

  const clearInvalidBlinkTimer = useCallback(() => {
    if (invalidBlinkTimeoutRef.current) {
      clearTimeout(invalidBlinkTimeoutRef.current);
      invalidBlinkTimeoutRef.current = null;
    }
  }, []);

  const scheduleInvalidBlinkHighlight = useCallback(
    (nodeIds: string[], stepIds: string[]) => {
      clearInvalidBlinkTimer();
      setInvalidNodeIds(nodeIds);
      setInvalidStepIds(stepIds);
      invalidBlinkTimeoutRef.current = setTimeout(() => {
        invalidBlinkTimeoutRef.current = null;
        setInvalidNodeIds([]);
        setInvalidStepIds([]);
      }, ACTIVATION_INVALID_BLINK_MS);
    },
    [clearInvalidBlinkTimer],
  );

  useEffect(() => () => clearInvalidBlinkTimer(), [clearInvalidBlinkTimer]);

  const handleActivate = useCallback(async (): Promise<boolean> => {
    if (!isPositiveInt(automationNumericId)) {
      toast.error("Open a saved automation before activating.");
      return false;
    }

    let connectionsForValidation = connections;
    try {
      const healed = await ensureMissingDesiredConnections(
        automationNumericId,
        nodes,
        connections,
      );
      if (healed.length > 0) {
        connectionsForValidation = [...connections, ...healed];
        setConnections(connectionsForValidation);
      }
    } catch (err) {
      toastApiError(err, "Could not fix branch connections before activating.");
      return false;
    }

    const workflowValidation = validateWorkflowForActivation(
      nodes,
      connectionsForValidation,
    );
    if (!workflowValidation.ok) {
      scheduleInvalidBlinkHighlight(
        workflowValidation.invalidNodeIds,
        workflowValidation.invalidStepIds,
      );
      if (workflowValidation.firstInvalidNodeId) {
        setSelectedId(workflowValidation.firstInvalidNodeId);
      }
      toast.error(workflowValidation.message, { duration: 5000 });
      return false;
    }

    clearInvalidBlinkTimer();
    setInvalidNodeIds([]);
    setInvalidStepIds([]);

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
      if (settingsSaveRef.current) {
        const stepSaved = await settingsSaveRef.current();
        if (!stepSaved) {
          return false;
        }
      }

      if (isFlowDirty) {
        await syncDirtyNodesToServer();
      }

      const updated = await activateAutomation(automationNumericId);
      syncAutomationQueryCache(queryClient, updated);
      if (isAutomationStatusResponse(updated)) {
        setAutomation((prev) =>
          prev ? { ...prev, status: "active" } : prev,
        );
        setStatus("active");
        setAutomationPublished(true);
      } else {
        setAutomation(mapAutomationToListItem(updated));
        setStatus("active");
        setAutomationPublished(updated.published === true);
      }
      setIsFlowDirty(false);
      setHasUnsavedStepSettings(false);
      await refetchAutomation();
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
    clearInvalidBlinkTimer,
    connections,
    isFlowDirty,
    nodes,
    queryClient,
    refetchAutomation,
    remoteAutomation?.purpose,
    scheduleInvalidBlinkHighlight,
    syncDirtyNodesToServer,
  ]);

  const handleDeactivate = useCallback(async () => {
    if (!isPositiveInt(automationNumericId)) {
      toast.error("Open a saved automation before deactivating.");
      return;
    }

    setActivating(true);
    try {
      const updated = await deactivateAutomation(automationNumericId);
      syncAutomationQueryCache(queryClient, updated);
      void queryClient.invalidateQueries({
        queryKey: automationQueryKeys.executionsRoot(automationNumericId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...automationQueryKeys.all, "execution-logs"],
      });
      if (isAutomationStatusResponse(updated)) {
        setAutomation((prev) =>
          prev ? { ...prev, status: "draft" } : prev,
        );
      } else {
        setAutomation(mapAutomationToListItem(updated));
      }
      setStatus("draft");
      setAutomationPublished(false);
      setNavPromptOpen(false);
      setPendingNav(null);
      await refetchAutomation();
      toast.success("Automation deactivated.");
    } catch (err) {
      toastApiError(err, "Could not deactivate automation.");
    } finally {
      setActivating(false);
    }
  }, [automationNumericId, queryClient, refetchAutomation]);

  const handleDeactivateFromPrompt = useCallback(async () => {
    await handleDeactivate();
    setDeactivatePromptOpen(false);
  }, [handleDeactivate]);

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
    async (
      blockId: WorkflowNodeKind,
      branchTarget?: WorkflowBranchTarget | null,
      dropPlacement?: WorkflowDropPlacement | null,
      insertAfterNodeId?: string | null,
    ) => {
      if (!guardEdit()) {
        return;
      }

      const block = AUTOMATION_BLOCKS.find((b) => b.id === blockId);
      if (!block) return;

      if (!isPositiveInt(automationNumericId)) {
        toast.error("Open a saved automation before adding nodes.");
        return;
      }

      if (isTriggerWorkflowKind(blockId) && !canAddTriggerBlock(nodes, blockId)) {
        toast.error(
          "A trigger already exists. Triggers can only be placed at the start of the flow.",
        );
        return;
      }

      if (addingBlockRef.current) return;

      const anchorNode = insertAfterNodeId
        ? nodes.find((node) => node.id === insertAfterNodeId) ?? null
        : null;
      const resolvedBranchTarget =
        branchTarget ??
        (anchorNode ? getNodeBranchPlacement(anchorNode) : null) ??
        (dropPlacement ? null : activeBranchTarget);

      if (
        blockId === "parallel_split" &&
        resolvedBranchTarget?.flowBranch &&
        !nodes.some((node) =>
          nodeMatchesBranchTarget(node, resolvedBranchTarget),
        )
      ) {
        toast.error(
          "Add a step to this branch before adding another Branch.",
        );
        return;
      }

      const defaultConfig = {
        ...defaultConfigForBlockKind(blockId, {
          nestUnderBranchId:
            blockId === "parallel_split"
              ? resolvedBranchTarget?.flowBranch ?? null
              : null,
        }),
        ...resolveBranchConfigForNewNode(
          nodes,
          selectedId,
          resolvedBranchTarget,
          dropPlacement,
        ),
      };
      const isTrigger = isTriggerWorkflowKind(blockId);
      const insertIndex = getWorkflowNodeInsertIndex(
        nodes,
        blockId,
        dropPlacement,
        resolvedBranchTarget,
        insertAfterNodeId,
      );
      const order = insertIndex;
      const firstExistingNode = isTrigger && nodes.length > 0 ? nodes[0]! : null;
      const previousNode = isTrigger
        ? null
        : resolvedBranchTarget?.flowBranch
          ? findPreviousNodeInBranch(nodes, insertIndex, resolvedBranchTarget)
          : findPreviousMainFlowNode(nodes, insertIndex);
      const nextNodeAfterInsert =
        !isTrigger && resolvedBranchTarget?.flowBranch
          ? findNextNodeInBranch(nodes, insertIndex, resolvedBranchTarget)
          : !isTrigger
            ? findNextMainFlowNode(nodes, insertIndex)
            : null;
      const tempId = `local-${blockId}-${Date.now()}`;
      const optimisticNode: WorkflowNode = {
        id: tempId,
        automationId: automationNumericId,
        kind: blockId,
        label: block.label,
        config: defaultConfig,
      };

      addingBlockRef.current = true;
      setNodes((prev) => insertWorkflowNode(prev, optimisticNode, insertIndex));
      setSelectedId(tempId);
      if (resolvedBranchTarget) {
        setActiveBranchTarget(resolvedBranchTarget);
      }
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
          id: tempId,
          kind: blockId,
          label: block.label,
          config: defaultConfig,
        };

        const createdConnections: AutomationConnection[] = [];
        let removedStaleIds = new Set<number>();
        if (isTrigger) {
          if (
            firstExistingNode?.numericId != null &&
            workflowNode.numericId != null
          ) {
            createdConnections.push(
              await createAutomationConnection({
                automationId: automationNumericId,
                sourceNodeId: workflowNode.numericId,
                targetNodeId: firstExistingNode.numericId,
              }),
            );
          }
        } else if (workflowNode.numericId != null) {
          if (
            previousNode?.numericId != null &&
            nextNodeAfterInsert?.numericId != null
          ) {
            const stale = connections.filter(
              (connection) =>
                connection.sourceNodeId === previousNode.numericId &&
                connection.targetNodeId === nextNodeAfterInsert.numericId,
            );
            removedStaleIds = new Set(stale.map((item) => item.id));
            for (const connection of stale) {
              try {
                await deleteAutomationConnection(connection.id);
              } catch {
              }
            }
            if (stale.length > 0) {
              setConnections((prev) =>
                prev.filter((connection) => !removedStaleIds.has(connection.id)),
              );
            }
          }

          if (previousNode?.numericId != null) {
            createdConnections.push(
              await createAutomationConnection({
                automationId: automationNumericId,
                sourceNodeId: previousNode.numericId,
                targetNodeId: workflowNode.numericId,
              }),
            );
          }

          if (nextNodeAfterInsert?.numericId != null) {
            createdConnections.push(
              await createAutomationConnection({
                automationId: automationNumericId,
                sourceNodeId: workflowNode.numericId,
                targetNodeId: nextNodeAfterInsert.numericId,
              }),
            );
          }
        }

        let nodesAfterInsert: WorkflowNode[] = [];
        setNodes((prev) => {
          nodesAfterInsert = prev.some((node) => node.id === tempId)
            ? prev.map((node) => (node.id === tempId ? workflowNode : node))
            : insertWorkflowNode(prev, workflowNode, insertIndex);
          return nodesAfterInsert;
        });

        const connectionsSoFar = [
          ...connections.filter((connection) => !removedStaleIds.has(connection.id)),
          ...createdConnections,
        ];
        const healed = await ensureMissingDesiredConnections(
          automationNumericId,
          nodesAfterInsert,
          connectionsSoFar,
        );
        if (createdConnections.length > 0 || healed.length > 0 || removedStaleIds.size > 0) {
          setConnections([...connectionsSoFar, ...healed]);
        }
        toast.success("Step added.");
      } catch (err) {
        setNodes((prev) => prev.filter((node) => node.id !== tempId));
        setSelectedId((current) => (current === tempId ? null : current));
        toastApiError(err, "Could not add step.");
      } finally {
        addingBlockRef.current = false;
      }
    },
    [
      automationNumericId,
      activeBranchTarget,
      connections,
      guardEdit,
      nodes,
      selectedId,
    ],
  );

  const onUpdateNode = useCallback(
    async (config: Record<string, unknown>) => {
      if (!guardEdit() || !selectedNode) return;

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
          await updateAutomationNode(numericId, {
            config,
          });
          invalidateAutomationQueries(queryClient, {
            automationId: automationNumericId ?? undefined,
            businessId:
              remoteAutomation?.businessId ?? remoteAutomation?.restaurantId,
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
    [
      automationNumericId,
      guardEdit,
      nodes,
      queryClient,
      remoteAutomation?.businessId,
      remoteAutomation?.purpose,
      remoteAutomation?.restaurantId,
      selectedNode,
    ],
  );

  const onDeleteNode = useCallback(async () => {
    if (!guardEdit() || !selectedNode) return;

    const nodeId = selectedNode.id;
    const numericId = selectedNode.numericId;
    const branchIds = isParallelSplitWorkflowNode(selectedNode)
      ? new Set(
          parseParallelBranchesFromConfig(selectedNode.config).map(
            (branch) => branch.id,
          ),
        )
      : null;

    const nodesToRemove = nodes.filter((node) => {
      if (node.id === nodeId) return true;
      if (!branchIds || branchIds.size === 0) return false;
      const placement = getNodeBranchPlacement(node);
      if (!placement) return false;
      if (branchIds.has(placement.flowBranch)) return true;
      if (
        placement.flowBranchParent &&
        branchIds.has(placement.flowBranchParent)
      ) {
        return true;
      }
      return false;
    });

    setDeletingNode(true);

    try {
      for (const node of nodesToRemove) {
        if (node.numericId != null) {
          await deleteAutomationNode(node.numericId);
        }
      }

      const removedIds = new Set(nodesToRemove.map((node) => node.id));
      const removedNumericIds = new Set(
        nodesToRemove
          .map((node) => node.numericId)
          .filter((id): id is number => id != null),
      );

      const remainingNodes = nodes.filter((node) => !removedIds.has(node.id));
      const remainingConnections = connections.filter(
        (connection) =>
          !removedNumericIds.has(connection.sourceNodeId) &&
          !removedNumericIds.has(connection.targetNodeId),
      );

      setNodes(remainingNodes);

      let nextConnections = remainingConnections;
      if (isPositiveInt(automationNumericId) && remainingNodes.length > 0) {
        const healed = await ensureMissingDesiredConnections(
          automationNumericId,
          remainingNodes,
          remainingConnections,
        );
        nextConnections = [...remainingConnections, ...healed];
      }
      setConnections(nextConnections);

      setSelectedId(null);
      setActiveBranchTarget(null);
      setIsFlowDirty(true);
      toast.success(
        isParallelSplitWorkflowNode(selectedNode)
          ? "Branch removed."
          : "Step removed.",
      );
    } catch (err) {
      toastApiError(err, "Could not delete step.");
    } finally {
      setDeletingNode(false);
    }
  }, [automationNumericId, connections, guardEdit, nodes, selectedNode]);

  const findSplitOwningBranch = useCallback(
    (branchTarget: WorkflowBranchTarget): WorkflowNode | null => {
      for (const node of nodes) {
        if (!isParallelSplitWorkflowNode(node)) continue;
        const ownsBranch = parseParallelBranchesFromConfig(node.config).some(
          (branch) => branch.id === branchTarget.flowBranch,
        );
        if (!ownsBranch) continue;
        const nest = getNodeBranchPlacement(node);
        if (branchTarget.flowBranchParent) {
          if (nest?.flowBranch === branchTarget.flowBranchParent) {
            return node;
          }
          continue;
        }
        if (!nest?.flowBranch) {
          return node;
        }
      }
      return null;
    },
    [nodes],
  );

  const collectNodesOnBranchPath = useCallback(
    (branchTarget: WorkflowBranchTarget): WorkflowNode[] => {
      const ownedBranchIds = new Set<string>([branchTarget.flowBranch]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const node of nodes) {
          if (!isParallelSplitWorkflowNode(node)) continue;
          const placement = getNodeBranchPlacement(node);
          const onOwnedPath =
            placement != null &&
            (ownedBranchIds.has(placement.flowBranch) ||
              (placement.flowBranchParent != null &&
                ownedBranchIds.has(placement.flowBranchParent)));
          if (!onOwnedPath) continue;
          for (const branch of parseParallelBranchesFromConfig(node.config)) {
            if (!ownedBranchIds.has(branch.id)) {
              ownedBranchIds.add(branch.id);
              grew = true;
            }
          }
        }
      }

      return nodes.filter((node) => {
        const placement = getNodeBranchPlacement(node);
        return placement != null && ownedBranchIds.has(placement.flowBranch);
      });
    },
    [nodes],
  );

  const onRenamePath = useCallback(
    async (payload: {
      branchTarget: WorkflowBranchTarget | null;
      title: string;
      entryNodeIds: string[];
      isContinueSection: boolean;
      nextTitle: string;
    }) => {
      if (!guardEdit()) return;
      const nextTitle = payload.nextTitle.trim();
      if (!nextTitle || nextTitle === payload.title.trim()) return;

      try {
        if (payload.isContinueSection || payload.branchTarget == null) {
          const titleNode =
            nodes.find(
              (node) =>
                payload.entryNodeIds.includes(node.id) &&
                String(node.config.flowSectionTitle ?? "").trim() ===
                  payload.title.trim(),
            ) ??
            nodes.find((node) => payload.entryNodeIds.includes(node.id));
          if (!titleNode) {
            toast.error("Could not find that path section.");
            return;
          }
          const nextConfig = {
            ...titleNode.config,
            flowSectionTitle: nextTitle,
          };
          if (titleNode.numericId != null) {
            await updateAutomationNode(titleNode.numericId, {
              config: nextConfig,
            });
          }
          setNodes((prev) =>
            prev.map((node) =>
              node.id === titleNode.id
                ? { ...node, config: nextConfig }
                : node,
            ),
          );
          setIsFlowDirty(true);
          toast.success("Path renamed.");
          return;
        }

        const splitNode = findSplitOwningBranch(payload.branchTarget);
        if (!splitNode) {
          toast.error("Could not find that branch.");
          return;
        }
        const branches = parseParallelBranchesFromConfig(splitNode.config).map(
          (branch) =>
            branch.id === payload.branchTarget!.flowBranch
              ? { ...branch, title: nextTitle }
              : branch,
        );
        const nextConfig = {
          ...splitNode.config,
          isParallelSplit: true,
          branches,
        };
        if (splitNode.numericId != null) {
          await updateAutomationNode(splitNode.numericId, {
            config: nextConfig,
          });
        }
        setNodes((prev) =>
          prev.map((node) =>
            node.id === splitNode.id ? { ...node, config: nextConfig } : node,
          ),
        );
        setIsFlowDirty(true);
        toast.success("Path renamed.");
      } catch (err) {
        toastApiError(err, "Could not rename path.");
      }
    },
    [findSplitOwningBranch, guardEdit, nodes],
  );

  const onDeletePath = useCallback(
    async (payload: {
      branchTarget: WorkflowBranchTarget | null;
      title: string;
      entryNodeIds: string[];
      isContinueSection: boolean;
    }) => {
      if (!guardEdit()) return;

      const label = payload.title.trim() || "this path";
      if (
        !window.confirm(
          `Delete “${label}” and all steps on it? This cannot be undone.`,
        )
      ) {
        return;
      }

      try {
        let nodesToRemove: WorkflowNode[] = [];
        let splitNode: WorkflowNode | null = null;
        let nextSplitConfig: Record<string, unknown> | null = null;

        if (payload.isContinueSection || payload.branchTarget == null) {
          const idSet = new Set(payload.entryNodeIds);
          nodesToRemove = nodes.filter((node) => idSet.has(node.id));
          if (nodesToRemove.length === 0) {
            toast.error("That group has no steps to remove.");
            return;
          }
        } else {
          nodesToRemove = collectNodesOnBranchPath(payload.branchTarget);
          splitNode = findSplitOwningBranch(payload.branchTarget);
          if (splitNode) {
            const branches = parseParallelBranchesFromConfig(splitNode.config);
            if (branches.length > 2) {
              nextSplitConfig = {
                ...splitNode.config,
                isParallelSplit: true,
                branches: branches.filter(
                  (branch) => branch.id !== payload.branchTarget!.flowBranch,
                ),
              };
            } else if (nodesToRemove.length === 0) {
              toast.error(
                "Keep at least two paths. Add another path before deleting this one.",
              );
              return;
            }
          } else if (nodesToRemove.length === 0) {
            toast.error("Could not find that path.");
            return;
          }
        }

        for (const node of nodesToRemove) {
          if (node.numericId != null) {
            await deleteAutomationNode(node.numericId);
          }
        }

        if (splitNode?.numericId != null && nextSplitConfig != null) {
          await updateAutomationNode(splitNode.numericId, {
            config: nextSplitConfig,
          });
        }

        const removedIds = new Set(nodesToRemove.map((node) => node.id));
        const removedNumericIds = new Set(
          nodesToRemove
            .map((node) => node.numericId)
            .filter((id): id is number => id != null),
        );

        let remainingNodes = nodes.filter((node) => !removedIds.has(node.id));
        if (splitNode != null && nextSplitConfig != null) {
          remainingNodes = remainingNodes.map((node) =>
            node.id === splitNode!.id
              ? { ...node, config: nextSplitConfig! }
              : node,
          );
        }

        const remainingConnections = connections.filter(
          (connection) =>
            !removedNumericIds.has(connection.sourceNodeId) &&
            !removedNumericIds.has(connection.targetNodeId),
        );

        setNodes(remainingNodes);

        let nextConnections = remainingConnections;
        if (isPositiveInt(automationNumericId) && remainingNodes.length > 0) {
          const healed = await ensureMissingDesiredConnections(
            automationNumericId,
            remainingNodes,
            remainingConnections,
          );
          nextConnections = [...remainingConnections, ...healed];
        }
        setConnections(nextConnections);

        if (selectedId && removedIds.has(selectedId)) {
          setSelectedId(null);
        }
        setActiveBranchTarget(null);
        setIsFlowDirty(true);
        toast.success(
          payload.isContinueSection ? "Path section removed." : "Path removed.",
        );
      } catch (err) {
        toastApiError(err, "Could not delete path.");
      }
    },
    [
      automationNumericId,
      collectNodesOnBranchPath,
      connections,
      findSplitOwningBranch,
      guardEdit,
      nodes,
      selectedId,
    ],
  );

  const onReorderNodes = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!guardEdit()) {
        return;
      }
      if (!isPositiveInt(automationNumericId)) {
        toast.error("Open a saved automation before reordering steps.");
        return;
      }

      const nextNodes = reorderWorkflowNodes(nodes, fromIndex, toIndex);
      if (nextNodes === nodes) {
        return;
      }

      setNodes(nextNodes);
      setIsFlowDirty(true);

      void (async () => {
        try {
          await Promise.all(
            nextNodes.map((node, order) => {
              if (node.numericId == null) {
                return Promise.resolve();
              }
              return updateAutomationNode(node.numericId, {
                order,
                config: node.config,
              });
            }),
          );

          const synced = await syncDesiredAutomationConnections(
            automationNumericId,
            nextNodes,
            connections,
          );
          setConnections(synced);
        } catch (err) {
          toastApiError(err, "Could not save step order.");
        }
      })();
    },
    [automationNumericId, connections, guardEdit, nodes],
  );

  useEffect(() => {
    if (invalidNodeIds.length === 0) {
      return;
    }
    const validation = validateWorkflowForActivation(nodes, connections);
    if (validation.ok) {
      clearInvalidBlinkTimer();
      setInvalidNodeIds([]);
      setInvalidStepIds([]);
    }
  }, [nodes, connections, invalidNodeIds.length, clearInvalidBlinkTimer]);

  const builderAlerts =
    tab === "builder" && (automationActive || hasUnsavedStepSettings) ? (
      <div className="shrink-0 space-y-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 sm:px-4 sm:py-2.5">
        {automationActive ? (
          <div className="flex items-start gap-2 rounded-xl border border-blue-200/90 bg-blue-50/90 px-3 py-2 text-xs leading-relaxed text-blue-950 sm:text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-blue-700" aria-hidden />
            <p>
              This automation is live. Deactivate it before editing steps or email
              copy.
            </p>
          </div>
        ) : null}
        {!automationActive && hasUnsavedStepSettings ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950 sm:text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
            <p>
              Unsaved email changes — guests still get the old text until you click{" "}
              <span className="font-semibold">Save changes</span> in the settings panel.
              Activate saves your edits automatically.
            </p>
          </div>
        ) : null}
      </div>
    ) : null;

  const detailsHeader =
    automation != null ? (
      <div className="shrink-0 border-b border-zinc-200/70 bg-white px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold tracking-tight text-[#07111f] sm:text-base">
              {automation.name}
            </h1>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500 sm:text-[0.8125rem]">
              {automation.description.trim()
                ? automation.description
                : "No description yet."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetailsEditOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-[#1877f2]/35 hover:bg-[#e8f2ff] hover:text-[#1877f2]"
            aria-label="Edit automation name and description"
          >
            <Pencil className="size-3.5" aria-hidden strokeWidth={2.25} />
            Edit
          </button>
        </div>
      </div>
    ) : null;

  const topbarCenterPortal =
    topbarCenterHost != null
      ? createPortal(
          <AutomationBuilderTabBar tab={tab} onTabChange={setBuilderTab} />,
          topbarCenterHost,
        )
      : null;

  const topbarActionsPortal =
    topbarActionsHost != null && tab === "builder"
      ? createPortal(
          <AutomationBuilderActivateButton
            automationActive={automationIsActive}
            activating={activating}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />,
          topbarActionsHost,
        )
      : null;

  return (
    <motion.div
      className="automation-builder-page flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f0f0f2]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: automationEase }}
    >
      {topbarCenterPortal}
      {topbarActionsPortal}
      {detailsHeader}
      {builderAlerts}
      <AnimatePresence mode="wait">
      {tab === "builder" ? (
        <motion.div
          key="builder"
          className="automation-builder-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: automationEase }}
        >
          <BuilderShell
            sidebar={
              <BlockSidebar
                editLocked={automationActive}
                onEditBlocked={showDeactivatePrompt}
                onAddBlock={(id) => {
                  const selectedNodeForAdd = selectedId
                    ? nodes.find((node) => node.id === selectedId) ?? null
                    : null;
                  const lastNode =
                    nodes.length > 0 ? nodes[nodes.length - 1]! : null;
                  const selectedIsBranch =
                    selectedNodeForAdd != null &&
                    isParallelSplitWorkflowNode(selectedNodeForAdd);
                  const lastIsEmptyBranch =
                    lastNode != null &&
                    isParallelSplitWorkflowNode(lastNode) &&
                    !nodes.some(
                      (node) => getNodeBranchPlacement(node) != null,
                    );

                  if (id === "parallel_split") {
                    const nestTarget =
                      activeBranchTarget?.flowBranch != null
                        ? activeBranchTarget
                        : null;
                    void onAddBlock(
                      id,
                      nestTarget,
                      nestTarget ? null : "main_flow",
                      selectedId,
                    );
                    return;
                  }

                  const pathTarget = resolveClickAddBranchTarget(
                    nodes,
                    selectedId,
                    activeBranchTarget,
                  );

                  if (
                    (selectedIsBranch || lastIsEmptyBranch) &&
                    pathTarget?.flowBranch
                  ) {
                    setActiveBranchTarget(pathTarget);
                    void onAddBlock(id, pathTarget);
                    return;
                  }

                  if (
                    selectedIsBranch ||
                    (lastIsEmptyBranch && !activeBranchTarget)
                  ) {
                    toast.error(
                      "Select a path (PATH 1, PATH 2, …) or drag this block onto a path.",
                    );
                    return;
                  }

                  void onAddBlock(id, activeBranchTarget ?? pathTarget);
                }}
                hideTriggers={hasTriggerNode(nodes)}
              />
            }
            canvas={
              <BuilderCanvas
                nodes={nodes}
                loading={nodesLoading || (bootstrapping && nodes.length === 0)}
                selectedId={selectedId}
                invalidNodeIds={invalidNodeIds}
                invalidStepIds={invalidStepIds}
                activeBranchTarget={activeBranchTarget}
                onSelect={(id) => {
                  setSelectedId(id);
                  const selected = nodes.find((node) => node.id === id);
                  if (!selected) {
                    setActiveBranchTarget(null);
                    return;
                  }
                  const placement = getNodeBranchPlacement(selected);
                  if (placement) {
                    setActiveBranchTarget(placement);
                    return;
                  }
                  if (isParallelSplitWorkflowNode(selected)) {
                    setActiveBranchTarget(
                      resolveClickAddBranchTarget(nodes, id, null),
                    );
                    return;
                  }
                  setActiveBranchTarget(null);
                }}
                onActiveBranchChange={setActiveBranchTarget}
                editLocked={automationActive}
                onEditBlocked={showDeactivatePrompt}
                onDropBlock={(
                  id,
                  branchTarget,
                  dropPlacement,
                  insertAfterNodeId,
                ) => {
                  if (branchTarget) {
                    setActiveBranchTarget(branchTarget);
                  } else if (dropPlacement === "after_parallel_split") {
                    toast.error(
                      "Drop this block onto a path (PATH 1, PATH 2, …) to continue that branch.",
                    );
                    return;
                  }
                  void onAddBlock(
                    id,
                    branchTarget,
                    dropPlacement,
                    insertAfterNodeId,
                  );
                }}
                onReorderNodes={onReorderNodes}
                onRenamePath={(payload) => {
                  void onRenamePath(payload);
                }}
                onDeletePath={(payload) => {
                  void onDeletePath(payload);
                }}
              />
            }
            settingsPanel={
              <NodeSettingsPanel
                node={selectedNode}
                nodes={nodes}
                automationPurpose={remoteAutomation?.purpose}
                readOnly={automationActive}
                onEditBlocked={showDeactivatePrompt}
                onSave={onUpdateNode}
                onDelete={onDeleteNode}
                onSettingsDirtyChange={setHasUnsavedStepSettings}
                settingsSaveRef={settingsSaveRef}
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
            autoRunHint={autoRunHint}
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
      <DeactivateToEditDialog
        open={deactivatePromptOpen}
        isLoading={activating}
        onClose={closeDeactivatePrompt}
        onDeactivate={() => void handleDeactivateFromPrompt()}
      />
      <EditAutomationDetailsDialog
        open={detailsEditOpen}
        initialName={automation?.name ?? ""}
        initialDescription={automation?.description ?? ""}
        isSaving={savingDetails}
        onClose={() => {
          if (!savingDetails) setDetailsEditOpen(false);
        }}
        onSave={async ({ name, description }) => {
          if (!isPositiveInt(automationNumericId)) {
            toast.error("Could not update this automation.");
            return;
          }
          setSavingDetails(true);
          try {
            const updated = await updateAutomation(automationNumericId, {
              name,
              description,
            });
            if (isAutomationStatusResponse(updated)) {
              toast.error("Could not update automation details.");
              return;
            }
            syncAutomationQueryCache(queryClient, updated, {
              invalidate: false,
            });
            setAutomation((prev) =>
              prev
                ? {
                    ...prev,
                    name: updated.name,
                    description: updated.description?.trim() ?? "",
                  }
                : mapAutomationToListItem(updated),
            );
            setDetailsEditOpen(false);
            toast.success("Automation details saved.");
          } catch (err) {
            toastApiError(err, "Could not update automation details.");
          } finally {
            setSavingDetails(false);
          }
        }}
      />
    </motion.div>
  );
}
