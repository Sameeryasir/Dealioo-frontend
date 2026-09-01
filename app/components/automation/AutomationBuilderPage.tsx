"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ActivateFlowPromptDialog } from "@/app/components/automation/ActivateFlowPromptDialog";
import { DeactivateToEditDialog } from "@/app/components/automation/DeactivateToEditDialog";
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
  type WorkflowBranchTarget,
  type WorkflowDropPlacement,
} from "@/app/components/automation/builder/workflow-branch-context";

const ACTIVATION_INVALID_BLINK_MS = 3500;

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

    const workflowValidation = validateWorkflowForActivation(nodes);
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

      const updated = await updateAutomation(automationNumericId, {
        isActive: true,
        published: true,
      });
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
      const updated = await updateAutomation(automationNumericId, {
        isActive: false,
        published: false,
      });
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

      const defaultConfig = {
        ...defaultConfigForBlockKind(blockId),
        ...resolveBranchConfigForNewNode(
          nodes,
          selectedId,
          branchTarget,
          dropPlacement,
        ),
      };
      const isTrigger = isTriggerWorkflowKind(blockId);
      const insertIndex = getWorkflowNodeInsertIndex(nodes, blockId, dropPlacement);
      const order = insertIndex;
      const firstExistingNode = isTrigger && nodes.length > 0 ? nodes[0]! : null;
      const previousNode = isTrigger
        ? null
        : insertIndex > 0
          ? nodes[insertIndex - 1]!
          : nodes.length > 0
            ? nodes[nodes.length - 1]!
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
        if (isTrigger) {
          if (
            firstExistingNode?.numericId != null &&
            workflowNode.numericId != null
          ) {
            newConnection = await createAutomationConnection({
              automationId: automationNumericId,
              sourceNodeId: workflowNode.numericId,
              targetNodeId: firstExistingNode.numericId,
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
            insertIndex,
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
    [automationNumericId, guardEdit, nodes, selectedId],
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
  }, [guardEdit, selectedNode]);

  const onReorderNodes = useCallback((fromIndex: number, toIndex: number) => {
    if (!guardEdit()) {
      return;
    }

    let changed = false;
    setNodes((prev) => {
      const next = reorderWorkflowNodes(prev, fromIndex, toIndex);
      changed = next !== prev;
      return next;
    });
    if (changed) {
      setIsFlowDirty(true);
    }
  }, [guardEdit]);

  useEffect(() => {
    if (invalidNodeIds.length === 0) {
      return;
    }
    const validation = validateWorkflowForActivation(nodes);
    if (validation.ok) {
      clearInvalidBlinkTimer();
      setInvalidNodeIds([]);
      setInvalidStepIds([]);
    }
  }, [nodes, invalidNodeIds.length, clearInvalidBlinkTimer]);

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
                onAddBlock={(id) => void onAddBlock(id)}
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
                onSelect={setSelectedId}
                editLocked={automationActive}
                onEditBlocked={showDeactivatePrompt}
                onDropBlock={(id, branchTarget, dropPlacement) =>
                  void onAddBlock(id, branchTarget, dropPlacement)
                }
                onReorderNodes={onReorderNodes}
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
    </motion.div>
  );
}
