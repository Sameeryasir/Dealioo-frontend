"use client";

import { LayoutTemplate, Minus, Plus, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  isBlockDrag,
  readBlockDragData,
} from "@/app/components/automation/builder/automation-dnd";
import {
  WorkflowConnector,
  TriggerFlowConnector,
  FlowSplitTrunk,
  FlowSplitStem,
  FlowParallelSplitFork,
  BranchTraceLine,
  PrepaidVisitSplitConnector,
} from "@/app/components/automation/builder/WorkflowConnector";
import {
  FlowActionsBlock,
  FlowBranchContainer,
  FlowStepCard,
  PrepaidLoopBackCard,
} from "@/app/components/automation/builder/flow-step-cards";
import { isActionNodeKind } from "@/app/components/automation/automation-ui";
import {
  buildSegmentsForIndexedNodes,
  getParallelBranchDefs,
  isParallelSplitNode,
  parallelTreeHasNestedSplit,
  parsePaymentReminderSplitLayout,
  parsePrepaidVisitSplitLayout,
  parseSplitFlowLayout,
  type IndexedWorkflowNode,
  type ParallelBranchColumn,
} from "@/app/components/automation/builder/flow-layout";
import {
  buildFlowSegments,
  splitTriggerAndFlow,
  type FlowSegment,
} from "@/app/components/automation/builder/flow-segments";
import { WorkflowNodeCard } from "@/app/components/automation/builder/WorkflowNodeCard";
import {
  automationEase,
  flowConnectorReveal,
  flowListStagger,
  flowStepReveal,
} from "@/app/lib/motion";
import {
  clampWorkflowDropIndex,
  isWorkflowNodeReorderLocked,
} from "@/app/components/automation/workflow-node-order";
import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";
import type {
  WorkflowBranchTarget,
  WorkflowDropPlacement,
} from "@/app/components/automation/builder/workflow-branch-context";
import { getNodeBranchPlacement } from "@/app/components/automation/builder/workflow-branch-context";
import {
  isWorkflowNodeInvalid,
} from "@/app/components/automation/builder/workflow-activation-validation";

const FLOW_CARD_WIDTH_CLASS = "w-[36rem] shrink-0";
const FLOW_TRUNK_WIDTH = FLOW_CARD_WIDTH_CLASS;
const FLOW_BRANCH_GAP_PX = 48;
const LONG_PRESS_MS = 450;
const POINTER_MOVE_CANCEL_PX = 10;

const ZOOM_MIN = 0;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
}

type DragPreview = {
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

function FlowLoadingPlaceholder() {
  return (
    <motion.div
      className={`flex ${FLOW_TRUNK_WIDTH} flex-col items-center gap-4 py-8`}
      variants={flowListStagger}
      initial="hidden"
      animate="show"
    >
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          variants={flowStepReveal}
          className="h-[4.5rem] w-full overflow-hidden rounded-2xl border border-zinc-200/60 bg-zinc-100/80 shadow-sm"
        >
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-200/70 to-zinc-100 bg-[length:200%_100%]" />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function BuilderCanvas({
  nodes,
  loading = false,
  selectedId,
  invalidNodeIds = [],
  invalidStepIds = [],
  activeBranchTarget = null,
  onSelect,
  onActiveBranchChange,
  onDropBlock,
  onReorderNodes,
  editLocked = false,
  onEditBlocked,
}: {
  nodes: WorkflowNode[];
  loading?: boolean;
  selectedId: string | null;
  invalidNodeIds?: readonly string[];
  invalidStepIds?: readonly string[];
  activeBranchTarget?: WorkflowBranchTarget | null;
  onSelect: (id: string) => void;
  onActiveBranchChange?: (target: WorkflowBranchTarget | null) => void;
  onDropBlock?: (
    blockId: WorkflowNodeKind,
    branchTarget?: WorkflowBranchTarget | null,
    dropPlacement?: WorkflowDropPlacement | null,
    insertAfterNodeId?: string | null,
  ) => void;
  onReorderNodes?: (fromIndex: number, toIndex: number) => void;
  editLocked?: boolean;
  onEditBlocked?: () => void;
}) {
  const [revealKey, setRevealKey] = useState(0);
  const wasLoadingRef = useRef(loading);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [pressingIndex, setPressingIndex] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [canvasDragOver, setCanvasDragOver] = useState(false);
  const [dropHoverNodeId, setDropHoverNodeId] = useState<string | null>(null);
  const [dropHoverBranchKey, setDropHoverBranchKey] = useState<string | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const zoomContentRef = useRef<HTMLDivElement | null>(null);
  const [nativeContentSize, setNativeContentSize] = useState({
    width: 0,
    height: 0,
  });

  const nodeSlotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerSessionRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    pointerId: number;
    didDrag: boolean;
  } | null>(null);

  const canDropBlocks = onDropBlock != null && !editLocked;
  const canReorder = onReorderNodes != null && nodes.length > 1 && !editLocked;

  useEffect(() => {
    if (wasLoadingRef.current && !loading && nodes.length > 0) {
      setRevealKey((k) => k + 1);
    }
    wasLoadingRef.current = loading;
  }, [loading, nodes.length]);

  const clearPointerReorder = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerSessionRef.current = null;
    setDraggingIndex(null);
    setPressingIndex(null);
    setDragPreview(null);
  }, []);

  const clearDragState = useCallback(() => {
    clearPointerReorder();
    setCanvasDragOver(false);
    setDropHoverNodeId(null);
    setDropHoverBranchKey(null);
  }, [clearPointerReorder]);

  const branchTargetKey = useCallback((target: WorkflowBranchTarget | null) => {
    if (!target?.flowBranch) return null;
    return target.flowBranchParent
      ? `${target.flowBranchParent}>${target.flowBranch}`
      : target.flowBranch;
  }, []);

  const handleNodeBlockDragOver = useCallback(
    (e: React.DragEvent, nodeId: string) => {
      if (!canDropBlocks || !isBlockDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setCanvasDragOver(true);
      setDropHoverNodeId(nodeId);
      setDropHoverBranchKey(null);
    },
    [canDropBlocks],
  );

  const handleNodeBlockDragLeave = useCallback(
    (e: React.DragEvent, nodeId: string) => {
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      setDropHoverNodeId((current) => (current === nodeId ? null : current));
    },
    [],
  );

  const resolveDropIndex = useCallback(
    (clientY: number, fromIndex: number | null) => {
      const slots = nodeSlotRefs.current;
      for (let i = 0; i < slots.length; i++) {
        const el = slots[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          return fromIndex == null
            ? i
            : clampWorkflowDropIndex(nodes, i, fromIndex);
        }
      }
      const endIndex = nodes.length;
      return fromIndex == null
        ? endIndex
        : clampWorkflowDropIndex(nodes, endIndex, fromIndex);
    },
    [nodes],
  );

  const finishPointerReorder = useCallback(
    (clientY: number) => {
      const session = pointerSessionRef.current;
      const fromIndex = draggingIndex;
      clearPointerReorder();

      if (fromIndex == null || !session?.didDrag || !onReorderNodes) return;

      const toIndex = resolveDropIndex(clientY, fromIndex);
      if (fromIndex !== toIndex) onReorderNodes(fromIndex, toIndex);
    },
    [clearPointerReorder, draggingIndex, onReorderNodes, resolveDropIndex],
  );

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (!canReorder || e.button !== 0) return;
      if (isWorkflowNodeReorderLocked(nodes, index)) return;

      const target = e.currentTarget;
      pointerSessionRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
        didDrag: false,
      };

      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        const rect = target.getBoundingClientRect();
        const session = pointerSessionRef.current;
        const pointerX = session?.startX ?? e.clientX;
        const pointerY = session?.startY ?? e.clientY;
        setPressingIndex(null);
        setDraggingIndex(index);
        setDragPreview({
          x: pointerX,
          y: pointerY,
          width: rect.width,
          height: rect.height,
          offsetX: pointerX - rect.left,
          offsetY: pointerY - rect.top,
        });
        pointerSessionRef.current = {
          ...pointerSessionRef.current!,
          didDrag: true,
        };
        target.setPointerCapture(e.pointerId);
      }, LONG_PRESS_MS);

      setPressingIndex(index);
    },
    [canReorder, nodes],
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const session = pointerSessionRef.current;
      if (!session || e.pointerId !== session.pointerId) return;

      const moved = Math.hypot(
        e.clientX - session.startX,
        e.clientY - session.startY,
      );

      if (draggingIndex == null) {
        if (moved > POINTER_MOVE_CANCEL_PX) {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          setPressingIndex(null);
          pointerSessionRef.current = null;
        }
        return;
      }

      e.preventDefault();
      setDragPreview((prev) =>
        prev
          ? { ...prev, x: e.clientX, y: e.clientY }
          : null,
      );
    },
    [draggingIndex],
  );

  const handleNodePointerUp = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      nodeId: string,
      options?: { skipSelect?: boolean },
    ) => {
      const session = pointerSessionRef.current;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (draggingIndex != null) {
        finishPointerReorder(e.clientY);
        return;
      }

      const moved = session
        ? Math.hypot(e.clientX - session.startX, e.clientY - session.startY)
        : 0;
      clearPointerReorder();
      if (options?.skipSelect) return;
      if (moved < POINTER_MOVE_CANCEL_PX) onSelect(nodeId);
    },
    [clearPointerReorder, draggingIndex, finishPointerReorder, onSelect],
  );

  const handleNodePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingIndex != null) finishPointerReorder(e.clientY);
      else clearPointerReorder();
    },
    [clearPointerReorder, draggingIndex, finishPointerReorder],
  );

  const handleCanvasDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!canDropBlocks || !isBlockDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setCanvasDragOver(true);
    },
    [canDropBlocks],
  );

  const handleSlotDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!canDropBlocks || !isBlockDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      setCanvasDragOver(true);
    },
    [canDropBlocks],
  );

  const handleBlockDrop = useCallback(
    (
      e: React.DragEvent,
      branchTarget?: WorkflowBranchTarget | null,
      dropPlacement?: WorkflowDropPlacement | null,
      insertAfterNodeId?: string | null,
    ) => {
      if (!isBlockDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      clearDragState();
      if (editLocked) {
        onEditBlocked?.();
        return;
      }
      if (!onDropBlock) return;
      const blockId = readBlockDragData(e.dataTransfer);
      if (blockId) {
        onDropBlock(
          blockId,
          branchTarget ?? null,
          dropPlacement ?? null,
          insertAfterNodeId ?? null,
        );
      }
    },
    [clearDragState, editLocked, onDropBlock, onEditBlocked],
  );

  useEffect(() => {
    nodeSlotRefs.current.length = nodes.length;
  }, [nodes.length]);

  const { trigger, flowNodes, flowStartIndex } = splitTriggerAndFlow(nodes);
  const prepaidVisitSplit = parsePrepaidVisitSplitLayout(flowNodes, flowStartIndex);
  const paymentReminderSplit = parsePaymentReminderSplitLayout(
    flowNodes,
    flowStartIndex,
  );
  const splitLayout = parseSplitFlowLayout(flowNodes, flowStartIndex);

  const handleCanvasBlockDrop = useCallback(
    (e: React.DragEvent) => {
      if (dropHoverBranchKey && dropHoverBranchKey !== "after_parallel_split") {
        const parts = dropHoverBranchKey.split(">");
        const branchTarget: WorkflowBranchTarget =
          parts.length >= 2
            ? {
                flowBranchParent: parts[parts.length - 2]!,
                flowBranch: parts[parts.length - 1]!,
              }
            : { flowBranch: dropHoverBranchKey };
        handleBlockDrop(e, branchTarget);
        return;
      }
      if (dropHoverNodeId) {
        const anchor = nodes.find((node) => node.id === dropHoverNodeId);
        handleBlockDrop(
          e,
          anchor ? getNodeBranchPlacement(anchor) : null,
          null,
          dropHoverNodeId,
        );
        return;
      }
      handleBlockDrop(
        e,
        null,
        splitLayout.hasSplit ? "after_parallel_split" : null,
      );
    },
    [
      dropHoverBranchKey,
      dropHoverNodeId,
      handleBlockDrop,
      nodes,
      splitLayout.hasSplit,
    ],
  );
  const usePrepaidVisitSplit = prepaidVisitSplit.hasSplit;
  const usePaymentReminderSections = false;
  const headSegments = usePrepaidVisitSplit
    ? buildSegmentsForIndexedNodes(prepaidVisitSplit.head)
    : usePaymentReminderSections
      ? buildSegmentsForIndexedNodes(paymentReminderSplit.head)
      : splitLayout.hasSplit
        ? buildSegmentsForIndexedNodes(splitLayout.head)
        : buildFlowSegments(flowNodes, flowStartIndex);
  const visitedYesSegments = buildSegmentsForIndexedNodes(
    prepaidVisitSplit.visitedYes,
  );
  const branchColumns = splitLayout.branchColumns;
  const parallelTree = splitLayout.tree;
  const flowSegments =
    usePrepaidVisitSplit || usePaymentReminderSections || splitLayout.hasSplit
      ? headSegments
      : buildFlowSegments(flowNodes, flowStartIndex);

  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);
  const zoomOut = useCallback(() => {
    setZoom((current) => clampZoom(current - ZOOM_STEP));
  }, []);
  const zoomIn = useCallback(() => {
    setZoom((current) => clampZoom(current + ZOOM_STEP));
  }, []);
  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  useLayoutEffect(() => {
    const el = zoomContentRef.current;
    if (!el) return;

    const measure = () => {
      setNativeContentSize({
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [revealKey, loading, nodes.length, branchColumns.length]);

  const renderNodeSlot = (
    node: WorkflowNode,
    index: number,
    content: React.ReactNode,
    options?: {
      skipSelectOnPointerUp?: boolean;
      insertAfterNodeId?: string;
      branchTarget?: WorkflowBranchTarget | null;
    },
  ) => {
    const reorderLocked = isWorkflowNodeReorderLocked(nodes, index);
    const dropAnchorId = options?.insertAfterNodeId ?? node.id;
    const isDropHover = dropHoverNodeId === dropAnchorId;

    return (
      <div
        ref={(el) => {
          nodeSlotRefs.current[index] = el;
        }}
        className={`w-full rounded-2xl transition ${
          isDropHover
            ? "ring-2 ring-[#1877f2] ring-offset-2 ring-offset-[#ececee] scale-[1.01]"
            : ""
        } ${
          draggingIndex !== null || pressingIndex !== null ? "touch-none" : ""
        } ${
          reorderLocked
            ? "cursor-default"
            : canReorder
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-pointer"
        }`}
        onPointerDown={(e) => handleNodePointerDown(e, index)}
        onPointerMove={handleNodePointerMove}
        onPointerUp={(e) =>
          handleNodePointerUp(e, node.id, {
            skipSelect: options?.skipSelectOnPointerUp,
          })
        }
        onPointerCancel={handleNodePointerCancel}
        onDragOver={
          canDropBlocks
            ? (e) => handleNodeBlockDragOver(e, dropAnchorId)
            : undefined
        }
        onDragLeave={
          canDropBlocks
            ? (e) => handleNodeBlockDragLeave(e, dropAnchorId)
            : undefined
        }
        onDrop={
          canDropBlocks
            ? (e) =>
                handleBlockDrop(
                  e,
                  options?.branchTarget ?? getNodeBranchPlacement(node),
                  null,
                  dropAnchorId,
                )
            : undefined
        }
      >
        {draggingIndex === index ? (
          <div
            className="flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-violet-300/90 bg-violet-50/50 px-4 text-xs font-semibold text-violet-500"
            style={{ minHeight: dragPreview?.height ?? 72 }}
            aria-hidden
          />
        ) : (
          content
        )}
      </div>
    );
  };

  const renderSegmentList = (
    segments: FlowSegment[],
    options?: {
      branchStepNumber?: number;
      showInlineSectionTitle?: boolean;
      branchTarget?: WorkflowBranchTarget | null;
      dropPlacement?: WorkflowDropPlacement | null;
    },
  ) =>
    segments.map((segment, segmentIndex) => {
      const index =
        segment.type === "actions" ? segment.startIndex : segment.index;
      const slotNode = nodes[index]!;
      const displayNode =
        segment.type === "actions" ? segment.nodes[0]! : segment.node;

      if (isParallelSplitNode(displayNode)) {
        return null;
      }
      const isLast = segmentIndex === segments.length - 1;
      const isBranchAction =
        options?.branchStepNumber != null &&
        isLast &&
        (segment.type === "actions" ||
          (segment.type === "node" && isActionNodeKind(displayNode.kind)));

      const stepFooter = isBranchAction ? (
        <>
          <span>#{options!.branchStepNumber}</span>
          <span>0 sends · $0.00 · v0</span>
        </>
      ) : segment.type === "actions" ? (
        <>
          <span>#{index + 1}</span>
          <span>0 sends · $0.00</span>
        </>
      ) : undefined;

      const insertAfterNodeId =
        segment.type === "actions"
          ? segment.nodes[segment.nodes.length - 1]!.id
          : displayNode.id;

      const stepContent =
        segment.type === "actions" ? (
          renderNodeSlot(
            slotNode,
            index,
            <FlowActionsBlock
              nodes={segment.nodes}
              selectedId={selectedId}
              ownerNodeId={slotNode.id}
              footer={stepFooter}
              invalidStepIds={invalidStepIds}
              onSelectStep={onSelect}
            />,
            {
              skipSelectOnPointerUp: segment.nodes.length > 1,
              insertAfterNodeId,
              branchTarget: options?.branchTarget ?? null,
            },
          )
        ) : isActionNodeKind(displayNode.kind) ? (
          renderNodeSlot(
            slotNode,
            index,
            <FlowActionsBlock
              nodes={[displayNode]}
              selectedId={selectedId}
              footer={stepFooter}
              invalidStepIds={invalidStepIds}
              onSelectStep={onSelect}
            />,
            {
              insertAfterNodeId,
              branchTarget: options?.branchTarget ?? null,
            },
          )
        ) : (
          renderNodeSlot(
            slotNode,
            index,
            <FlowStepCard
              node={displayNode}
              selected={selectedId === slotNode.id}
              pressing={pressingIndex === index}
              invalid={isWorkflowNodeInvalid(slotNode.id, invalidNodeIds)}
              invalidStepIds={invalidStepIds}
            />,
            {
              insertAfterNodeId,
              branchTarget: options?.branchTarget ?? null,
            },
          )
        );

      const sectionTitle =
        typeof displayNode.config?.flowSectionTitle === "string"
          ? displayNode.config.flowSectionTitle.trim()
          : "";

      return (
        <motion.div
          key={
            segment.type === "actions"
              ? `actions-${slotNode.id}`
              : slotNode.id
          }
          className="flex w-full flex-col items-center"
          variants={flowStepReveal}
        >
          {options?.showInlineSectionTitle && sectionTitle ? (
            <p className="mb-2 max-w-full truncate px-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500">
              {sectionTitle}
            </p>
          ) : null}
          {stepContent}
          {segmentIndex < segments.length - 1 ? (
            <motion.div
              className="flex w-full justify-center py-1.5"
              variants={flowConnectorReveal}
              onDragOver={(e) => {
                handleSlotDragOver(e);
                setDropHoverNodeId(insertAfterNodeId);
                setDropHoverBranchKey(null);
              }}
              onDragLeave={(e) => {
                const next = e.relatedTarget as Node | null;
                if (next && e.currentTarget.contains(next)) return;
                setDropHoverNodeId((current) =>
                  current === insertAfterNodeId ? null : current,
                );
              }}
              onDrop={(e) =>
                handleBlockDrop(
                  e,
                  options?.branchTarget ?? null,
                  options?.dropPlacement ??
                    (splitLayout.hasSplit && !options?.branchTarget
                      ? "main_flow"
                      : null),
                  insertAfterNodeId,
                )
              }
            >
              <WorkflowConnector />
            </motion.div>
          ) : null}
        </motion.div>
      );
    });

  const renderSplitBranches = () => {
    const splitNode = splitLayout.parallelSplit?.node;
    const columns = parallelTree.branches;
    const count = columns.length;

    return (
      <div className="flex w-max max-w-none flex-col items-center">
        {splitNode ? (
          <FlowParallelSplitFork
            branches={getParallelBranchDefs(splitNode)}
            wide
            selected={selectedId === splitNode.id}
            onSelect={() => onSelect(splitNode.id)}
          />
        ) : null}
        <div
          className="flex w-max max-w-none items-start justify-center"
          style={{ gap: FLOW_BRANCH_GAP_PX }}
        >
          {columns.map((column, columnIndex) =>
            renderParallelBranchColumn(column, 0, columnIndex, {
              showStem: false,
              isFirst: columnIndex === 0,
              isLast: columnIndex === count - 1,
            }),
          )}
        </div>
      </div>
    );
  };

  const splitBranchSections = (
    entries: IndexedWorkflowNode[],
    defaultTitle: string,
  ): { title: string; entries: IndexedWorkflowNode[] }[] => {
    if (entries.length === 0) return [];
    const sections: { title: string; entries: IndexedWorkflowNode[] }[] = [];
    let currentTitle = defaultTitle;
    let current: IndexedWorkflowNode[] = [];

    for (const entry of entries) {
      const raw = entry.node.config?.flowSectionTitle;
      const nextTitle =
        typeof raw === "string" && raw.trim() ? raw.trim() : null;
      if (nextTitle != null && current.length > 0) {
        sections.push({ title: currentTitle, entries: current });
        current = [entry];
        currentTitle = nextTitle;
        continue;
      }
      if (nextTitle != null && current.length === 0) {
        currentTitle = nextTitle;
      }
      current.push(entry);
    }
    if (current.length > 0) {
      sections.push({ title: currentTitle, entries: current });
    }
    return sections;
  };

  const renderBranchDropZone = (
    target: WorkflowBranchTarget | null,
    key: string,
  ) => {
    if (!canDropBlocks || !target) {
      return null;
    }

    const hoverKey = branchTargetKey(target);
    const isHover = hoverKey != null && dropHoverBranchKey === hoverKey;

    return (
      <div
        key={key}
        className={`mt-3 h-8 w-full rounded-xl border-2 border-dashed transition ${
          isHover
            ? "border-blue-400 bg-blue-50"
            : "border-transparent bg-transparent"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onActiveBranchChange?.(target);
        }}
        onDragOver={(e) => {
          handleSlotDragOver(e);
          if (hoverKey) setDropHoverBranchKey(hoverKey);
          setDropHoverNodeId(null);
        }}
        onDragLeave={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && e.currentTarget.contains(next)) return;
          setDropHoverBranchKey((current) =>
            current === hoverKey ? null : current,
          );
        }}
        onDrop={(e) => handleBlockDrop(e, target)}
        aria-hidden
      />
    );
  };

  const renderBranchSectionBox = (
    title: string,
    entries: IndexedWorkflowNode[],
    columnIndex: number,
    key: string,
    branchTarget?: WorkflowBranchTarget | null,
  ) => {
    const hoverKey = branchTargetKey(branchTarget ?? null);
    const isBranchHover =
      hoverKey != null && dropHoverBranchKey === hoverKey;
    const isActive =
      branchTarget != null &&
      activeBranchTarget?.flowBranch === branchTarget.flowBranch &&
      (activeBranchTarget.flowBranchParent ?? null) ===
        (branchTarget.flowBranchParent ?? null);

    return (
      <div
        key={key}
        className={`relative ${FLOW_CARD_WIDTH_CLASS}`}
        onDragOver={
          branchTarget
            ? (e) => {
                handleSlotDragOver(e);
                if (hoverKey) setDropHoverBranchKey(hoverKey);
                setDropHoverNodeId(null);
              }
            : undefined
        }
        onDragLeave={
          branchTarget
            ? (e) => {
                const next = e.relatedTarget as Node | null;
                if (next && e.currentTarget.contains(next)) return;
                setDropHoverBranchKey((current) =>
                  current === hoverKey ? null : current,
                );
              }
            : undefined
        }
        onDrop={
          branchTarget
            ? (e) => handleBlockDrop(e, branchTarget)
            : undefined
        }
        onClick={() => {
          if (branchTarget) {
            onActiveBranchChange?.(branchTarget);
          }
        }}
      >
        <FlowBranchContainer
          title={title}
          active={isActive || isBranchHover}
        >
          <div className="relative w-full">
            <BranchTraceLine />
            <div className="relative z-10 flex w-full flex-col items-center">
              {renderSegmentList(buildSegmentsForIndexedNodes(entries), {
                branchStepNumber: 18 + columnIndex,
                branchTarget: branchTarget ?? null,
              })}
              {renderBranchDropZone(
                branchTarget ?? null,
                `${key}-branch-drop`,
              )}
            </div>
          </div>
        </FlowBranchContainer>
      </div>
    );
  };

  const renderParallelBranchColumn = (
    column: ParallelBranchColumn,
    depth: number,
    columnIndex: number,
    fork?: { showStem: boolean; isFirst: boolean; isLast: boolean },
    parentBranchId?: string | null,
  ) => {
    const branchTarget: WorkflowBranchTarget = parentBranchId
      ? { flowBranch: column.id, flowBranchParent: parentBranchId }
      : { flowBranch: column.id };
    const nested = parallelTreeHasNestedSplit(column.content);
    const widthClass = nested ? "w-max max-w-none" : FLOW_CARD_WIDTH_CLASS;

    return (
      <div
        key={`${depth}-${column.id}`}
        className={`flex flex-col items-center ${widthClass}`}
        onDragOver={(e) => {
          handleSlotDragOver(e);
          const hoverKey = branchTargetKey(branchTarget);
          if (hoverKey) setDropHoverBranchKey(hoverKey);
          setDropHoverNodeId(null);
          onActiveBranchChange?.(branchTarget);
        }}
        onDragLeave={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && e.currentTarget.contains(next)) return;
          const hoverKey = branchTargetKey(branchTarget);
          setDropHoverBranchKey((current) =>
            current === hoverKey ? null : current,
          );
        }}
        onDrop={(e) => handleBlockDrop(e, branchTarget)}
      >
        {fork?.showStem ? (
          <FlowSplitStem
            isFirst={fork.isFirst}
            isLast={fork.isLast}
            gapPx={FLOW_BRANCH_GAP_PX}
          />
        ) : null}
        {nested ? (
          <>
            {column.content.head.length > 0 ? (
              <div className="flex flex-col items-center">
                {splitBranchSections(column.content.head, column.title).map(
                  (section, sectionIndex, all) => (
                    <div
                      key={`${depth}-${column.id}-head-${sectionIndex}`}
                      className="flex flex-col items-center"
                    >
                      {renderBranchSectionBox(
                        section.title,
                        section.entries,
                        columnIndex,
                        `${depth}-${column.id}-head-${sectionIndex}-box`,
                        branchTarget,
                      )}
                      {sectionIndex < all.length - 1 ? (
                        <div className="flex w-full justify-center py-1.5">
                          <WorkflowConnector />
                        </div>
                      ) : null}
                    </div>
                  ),
                )}
                <div className="flex w-full justify-center py-1.5">
                  <WorkflowConnector />
                </div>
              </div>
            ) : null}
            {column.content.parallelSplit ? (
              <FlowParallelSplitFork
                branches={getParallelBranchDefs(column.content.parallelSplit.node)}
                wide
                selected={selectedId === column.content.parallelSplit.node.id}
                onSelect={() => onSelect(column.content.parallelSplit!.node.id)}
              />
            ) : null}
            <div
              className="flex w-max max-w-none items-start justify-center"
              style={{ gap: FLOW_BRANCH_GAP_PX }}
            >
              {column.content.branches.map((child, childIndex) =>
                renderParallelBranchColumn(
                  child,
                  depth + 1,
                  childIndex,
                  {
                    showStem: false,
                    isFirst: childIndex === 0,
                    isLast: childIndex === column.content.branches.length - 1,
                  },
                  column.id,
                ),
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            {splitBranchSections(column.content.head, column.title).length > 0 ? (
              splitBranchSections(column.content.head, column.title).map(
                (section, sectionIndex, all) => (
                  <div
                    key={`${depth}-${column.id}-sec-${sectionIndex}`}
                    className="flex flex-col items-center"
                  >
                    {renderBranchSectionBox(
                      section.title,
                      section.entries,
                      columnIndex,
                      `${depth}-${column.id}-sec-${sectionIndex}-box`,
                      branchTarget,
                    )}
                    {sectionIndex < all.length - 1 ? (
                      <div className="flex w-full justify-center py-1.5">
                        <WorkflowConnector />
                      </div>
                    ) : null}
                  </div>
                ),
              )
            ) : (
              <div
                className={`relative ${FLOW_CARD_WIDTH_CLASS}`}
                onClick={() => onActiveBranchChange?.(branchTarget)}
                onDragOver={(e) => {
                  handleSlotDragOver(e);
                  const hoverKey = branchTargetKey(branchTarget);
                  if (hoverKey) setDropHoverBranchKey(hoverKey);
                  setDropHoverNodeId(null);
                }}
                onDragLeave={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && e.currentTarget.contains(next)) return;
                  const hoverKey = branchTargetKey(branchTarget);
                  setDropHoverBranchKey((current) =>
                    current === hoverKey ? null : current,
                  );
                }}
                onDrop={(e) => handleBlockDrop(e, branchTarget)}
              >
                <FlowBranchContainer
                  title={column.title}
                  active={
                    (activeBranchTarget?.flowBranch === branchTarget.flowBranch &&
                      (activeBranchTarget.flowBranchParent ?? null) ===
                        (branchTarget.flowBranchParent ?? null)) ||
                    dropHoverBranchKey === branchTargetKey(branchTarget)
                  }
                >
                  {renderBranchDropZone(
                    branchTarget,
                    `${depth}-${column.id}-empty-drop`,
                  )}
                </FlowBranchContainer>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPostSplitSection = () => {
    if (splitLayout.tail.length > 0) {
      return (
        <div className={`mt-6 flex flex-col items-center ${FLOW_TRUNK_WIDTH}`}>
          <WorkflowConnector />
          {renderSegmentList(buildSegmentsForIndexedNodes(splitLayout.tail), {
            dropPlacement: "after_parallel_split",
          })}
        </div>
      );
    }

    if (!canDropBlocks) {
      return null;
    }

    return (
      <div
        className={`mt-6 h-10 w-full max-w-md rounded-xl border-2 border-dashed transition ${
          dropHoverBranchKey === "after_parallel_split"
            ? "border-blue-400 bg-blue-50"
            : "border-transparent"
        }`}
        onDragOver={(e) => {
          handleSlotDragOver(e);
          setDropHoverBranchKey("after_parallel_split");
          setDropHoverNodeId(null);
        }}
        onDragLeave={(e) => {
          const next = e.relatedTarget as Node | null;
          if (next && e.currentTarget.contains(next)) return;
          setDropHoverBranchKey((current) =>
            current === "after_parallel_split" ? null : current,
          );
        }}
        onDrop={(e) => handleBlockDrop(e, null, "after_parallel_split")}
        aria-hidden
      />
    );
  };

  const renderPaymentReminderTrunk = () => {
    const sections = splitBranchSections(
      paymentReminderSplit.head,
      "Payment reminder journey",
    );

    return (
      <div className="flex w-full flex-col items-center gap-3">
        {sections.map((section, sectionIndex, all) => (
          <div
            key={`payment-reminder-section-${sectionIndex}`}
            className="flex w-full flex-col items-center"
          >
            {renderBranchSectionBox(
              section.title,
              section.entries,
              sectionIndex,
              `payment-reminder-section-${sectionIndex}`,
            )}
            {sectionIndex < all.length - 1 ? (
              <div className="flex w-full justify-center py-1.5">
                <WorkflowConnector />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderPrepaidVisitBranches = () => (
    <div className="flex w-max max-w-none flex-col items-center">
      <PrepaidVisitSplitConnector wide />
      <div
        className="flex w-max max-w-none items-start justify-center"
        style={{ gap: FLOW_BRANCH_GAP_PX }}
      >
        <div className={`flex flex-col items-center ${FLOW_CARD_WIDTH_CLASS}`}>
          <FlowBranchContainer>
            <PrepaidLoopBackCard
              loopTarget={prepaidVisitSplit.loopTarget?.node ?? null}
              flowNodes={flowNodes}
            />
          </FlowBranchContainer>
        </div>
        <div className={`flex flex-col items-center ${FLOW_CARD_WIDTH_CLASS}`}>
          <FlowBranchContainer>
            {renderSegmentList(visitedYesSegments)}
          </FlowBranchContainer>
        </div>
      </div>
    </div>
  );

  const draggedNode = draggingIndex != null ? nodes[draggingIndex] : null;

  const dragGhost =
    typeof document !== "undefined" &&
    draggedNode &&
    dragPreview &&
    createPortal(
      <div
        className="pointer-events-none fixed z-[200]"
        style={{
          left: dragPreview.x - dragPreview.offsetX,
          top: dragPreview.y - dragPreview.offsetY,
          width: dragPreview.width,
        }}
        aria-hidden
      >
        <WorkflowNodeCard
          node={draggedNode}
          selected={selectedId === draggedNode.id}
          isGhost
        />
      </div>,
      document.body,
    );

  return (
    <motion.div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#ececee]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(161 161 170 / 0.22) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,255,255,0.55),transparent_70%)]"
        aria-hidden
      />

      <motion.div
        className={`min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain px-3 py-10 pb-24 [scrollbar-gutter:stable] transition-colors duration-300 sm:px-4 sm:py-12 sm:pb-28 lg:px-5 lg:py-14 xl:px-6 xl:py-16 ${
          canvasDragOver ? "bg-violet-50/40" : ""
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: automationEase }}
        onDragOver={handleCanvasDragOver}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setCanvasDragOver(false);
          setDropHoverNodeId(null);
          setDropHoverBranchKey(null);
        }}
        onDrop={handleCanvasBlockDrop}
      >
        <div
          className="mx-auto"
          style={{
            width:
              nativeContentSize.width > 0
                ? nativeContentSize.width * zoom
                : "100%",
            height:
              nativeContentSize.height > 0
                ? nativeContentSize.height * zoom
                : undefined,
            minWidth: "100%",
          }}
        >
          <div
            ref={zoomContentRef}
            className="mx-auto flex w-max min-w-0 flex-col items-center will-change-transform"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <motion.div className="mx-auto flex w-max flex-col items-center">
          {loading ? (
            <FlowLoadingPlaceholder />
          ) : nodes.length === 0 ? (
            <motion.div
              className={`max-w-sm rounded-3xl border-2 border-dashed px-8 py-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-1 transition-all duration-300 ${
                canvasDragOver
                  ? "border-violet-400/80 bg-violet-50/90 ring-violet-200/60"
                  : "border-zinc-300/70 bg-white/85 ring-zinc-950/[0.03] backdrop-blur-sm"
              }`}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: automationEase }}
            >
              <div
                className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border transition-colors ${
                  canvasDragOver
                    ? "border-violet-200 bg-violet-100 text-violet-600"
                    : "border-zinc-200/90 bg-zinc-50 text-zinc-400"
                }`}
              >
                <LayoutTemplate className="size-7" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="text-sm font-semibold tracking-tight text-zinc-800">
                Drag a block here
              </p>
              <p className="mx-auto mt-2 max-w-[16rem] text-xs leading-relaxed text-zinc-500">
                Or click a block in the sidebar to add your first step.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={revealKey}
              className="flex w-max flex-col items-center"
              variants={flowListStagger}
              initial="hidden"
              animate="show"
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasBlockDrop}
            >
              {trigger ? (
                <>
                  <motion.div
                    className={`flex flex-col items-center ${FLOW_TRUNK_WIDTH}`}
                    variants={flowStepReveal}
                  >
                    {renderNodeSlot(
                      trigger,
                      0,
                      <WorkflowNodeCard
                        node={trigger}
                        selected={selectedId === trigger.id}
                        invalid={isWorkflowNodeInvalid(trigger.id, invalidNodeIds)}
                        invalidStepIds={invalidStepIds}
                        isPressing={pressingIndex === 0}
                        reorderLocked={isWorkflowNodeReorderLocked(nodes, 0)}
                      />,
                    )}
                    {flowSegments.length > 0 ? (
                      <>
                        <TriggerFlowConnector />
                        <div className="relative w-full rounded-[1.25rem] border-2 border-dashed border-zinc-300/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6rem] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/90 sm:left-4 sm:top-4 sm:px-3 sm:text-[0.625rem]">
                            <span
                              className="size-2 rounded-full bg-[#1877f2] shadow-[0_0_8px_rgba(24,119,242,0.65)]"
                              aria-hidden
                            />
                            Live
                          </span>
                          <div className="mt-10 flex flex-col gap-3 sm:mt-11 sm:gap-4">
                            {usePaymentReminderSections
                              ? renderPaymentReminderTrunk()
                              : renderSegmentList(flowSegments)}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                  {usePrepaidVisitSplit ? (
                    <div className="mt-6 w-max max-w-none">
                      {renderPrepaidVisitBranches()}
                    </div>
                  ) : splitLayout.hasSplit ? (
                    <div className="mt-6 flex w-max max-w-none flex-col items-center">
                      {renderSplitBranches()}
                      {renderPostSplitSection()}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className={FLOW_TRUNK_WIDTH}>{renderSegmentList(flowSegments)}</div>
              )}
              {canDropBlocks ? (
                <div
                  className="h-8 w-full"
                  onDragOver={handleSlotDragOver}
                  onDrop={(e) =>
                    handleBlockDrop(
                      e,
                      null,
                      splitLayout.hasSplit ? "after_parallel_split" : null,
                    )
                  }
                />
              ) : null}
            </motion.div>
          )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {!loading && nodes.length > 0 ? (
        <div
          className="pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full border border-zinc-200/90 bg-white/95 p-1 shadow-lg ring-1 ring-zinc-950/5 backdrop-blur-sm sm:bottom-5 sm:right-5"
          title="Zoom only scales the camera. Cards do not reflow — scroll to explore."
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            className="flex size-8 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
          <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-zinc-700">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            className="flex size-8 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="flex size-8 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100"
            aria-label="Reset zoom"
            title="Reset to 100%"
          >
            <RotateCcw className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}

      {dragGhost}
    </motion.div>
  );
}
