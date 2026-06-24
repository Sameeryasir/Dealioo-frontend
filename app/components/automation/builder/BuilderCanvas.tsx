"use client";

import { LayoutTemplate, Maximize2, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  isBlockDrag,
  readBlockDragData,
} from "@/app/components/automation/builder/automation-dnd";
import {
  WorkflowConnector,
  TriggerFlowConnector,
  FlowSplitConnector,
} from "@/app/components/automation/builder/WorkflowConnector";
import {
  FlowActionsBlock,
  FlowBranchContainer,
  FlowStepCard,
} from "@/app/components/automation/builder/flow-step-cards";
import { isActionNodeKind } from "@/app/components/automation/automation-ui";
import {
  buildSegmentsForIndexedNodes,
  FLOW_BRANCH_PASS,
  FLOW_BRANCH_PAYMENT,
  parseSplitFlowLayout,
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
  hasCronTriggerNode,
  isWorkflowNodeReorderLocked,
} from "@/app/components/automation/workflow-node-order";
import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";

const FLOW_TRUNK_WIDTH = "w-full max-w-md sm:max-w-lg lg:max-w-xl";
const FLOW_TREE_WIDTH = "w-full max-w-md sm:max-w-lg lg:max-w-5xl";
const ZOOM_MIN = 0.72;
const ZOOM_MAX = 1.2;
const ZOOM_STEP = 0.08;
const LONG_PRESS_MS = 450;
const POINTER_MOVE_CANCEL_PX = 10;

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
  onSelect,
  onDropBlock,
  onReorderNodes,
}: {
  nodes: WorkflowNode[];
  loading?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropBlock?: (blockId: WorkflowNodeKind) => void;
  onReorderNodes?: (fromIndex: number, toIndex: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [revealKey, setRevealKey] = useState(0);
  const wasLoadingRef = useRef(loading);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [pressingIndex, setPressingIndex] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [canvasDragOver, setCanvasDragOver] = useState(false);

  const nodeSlotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerSessionRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    pointerId: number;
    didDrag: boolean;
  } | null>(null);

  const canDropBlocks = onDropBlock != null;
  const canReorder = onReorderNodes != null && nodes.length > 1;

  const fitScreen = useCallback(() => setZoom(1), []);

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
  }, [clearPointerReorder]);

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
    (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
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
    (e: React.DragEvent) => {
      if (!canDropBlocks || !isBlockDrag(e.dataTransfer)) return;
      e.preventDefault();
      e.stopPropagation();
      clearDragState();
      const blockId = readBlockDragData(e.dataTransfer);
      if (blockId) onDropBlock?.(blockId);
    },
    [canDropBlocks, clearDragState, onDropBlock],
  );

  useEffect(() => {
    nodeSlotRefs.current.length = nodes.length;
  }, [nodes.length]);

  const { trigger, flowNodes, flowStartIndex } = splitTriggerAndFlow(nodes);
  const splitLayout = parseSplitFlowLayout(flowNodes, flowStartIndex);
  const headSegments = buildSegmentsForIndexedNodes(splitLayout.head);
  const passBranchSegments = buildSegmentsForIndexedNodes(
    splitLayout.branches[FLOW_BRANCH_PASS],
  );
  const paymentBranchSegments = buildSegmentsForIndexedNodes(
    splitLayout.branches[FLOW_BRANCH_PAYMENT],
  );
  const flowSegments = splitLayout.hasSplit
    ? headSegments
    : buildFlowSegments(flowNodes, flowStartIndex);

  const renderNodeSlot = (
    node: WorkflowNode,
    index: number,
    content: React.ReactNode,
  ) => {
    const reorderLocked = isWorkflowNodeReorderLocked(nodes, index);
    return (
      <div
        ref={(el) => {
          nodeSlotRefs.current[index] = el;
        }}
        className={`w-full ${
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
        onPointerUp={(e) => handleNodePointerUp(e, node.id)}
        onPointerCancel={handleNodePointerCancel}
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
    options?: { branchStepNumber?: number },
  ) =>
    segments.map((segment, segmentIndex) => {
      const node =
        segment.type === "actions" ? segment.nodes[0]! : segment.node;
      const index =
        segment.type === "actions" ? segment.startIndex : segment.index;
      const isLast = segmentIndex === segments.length - 1;
      const isBranchAction =
        options?.branchStepNumber != null &&
        isLast &&
        (segment.type === "actions" ||
          (segment.type === "node" && isActionNodeKind(node.kind)));

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

      const stepContent =
        segment.type === "actions" ? (
          renderNodeSlot(
            node,
            index,
            <FlowActionsBlock
              nodes={segment.nodes}
              selectedId={selectedId}
              footer={stepFooter}
            />,
          )
        ) : isActionNodeKind(node.kind) ? (
          renderNodeSlot(
            node,
            index,
            <FlowActionsBlock
              nodes={[node]}
              selectedId={selectedId}
              footer={stepFooter}
            />,
          )
        ) : (
          renderNodeSlot(
            node,
            index,
            <FlowStepCard
              node={node}
              selected={selectedId === node.id}
              pressing={pressingIndex === index}
            />,
          )
        );

      return (
        <motion.div
          key={
            segment.type === "actions"
              ? `actions-${segment.nodes.map((n) => n.id).join("-")}`
              : node.id
          }
          className="flex w-full flex-col items-center"
          variants={flowStepReveal}
        >
          {stepContent}
          {segmentIndex < segments.length - 1 ? (
            <motion.div
              className="flex w-full justify-center py-1.5"
              variants={flowConnectorReveal}
              onDragOver={handleSlotDragOver}
              onDrop={handleBlockDrop}
            >
              <WorkflowConnector />
            </motion.div>
          ) : null}
        </motion.div>
      );
    });

  const renderSplitBranches = () => (
    <div className="flex w-full flex-col items-center">
      <FlowSplitConnector wide />
      <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <FlowBranchContainer>
          {renderSegmentList(passBranchSegments, { branchStepNumber: 18 })}
        </FlowBranchContainer>
        <FlowBranchContainer>
          {renderSegmentList(paymentBranchSegments, { branchStepNumber: 19 })}
        </FlowBranchContainer>
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
        className="absolute bottom-4 left-4 z-20 flex items-center gap-0.5 rounded-xl border border-white/70 bg-white/75 p-0.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-zinc-950/[0.04] backdrop-blur-md sm:bottom-5 sm:left-5 sm:rounded-2xl sm:p-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: automationEase }}
      >
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100/90 hover:text-zinc-900 active:scale-95 sm:size-9 sm:rounded-xl"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="min-w-[2.75rem] text-center text-[0.65rem] font-bold tabular-nums tracking-wide text-zinc-500 sm:min-w-[3.25rem] sm:text-[0.7rem]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100/90 hover:text-zinc-900 active:scale-95 sm:size-9 sm:rounded-xl"
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <span className="mx-0.5 h-6 w-px bg-zinc-200/90" aria-hidden />
        <button
          type="button"
          aria-label="Fit screen"
          onClick={fitScreen}
          className="flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[0.65rem] font-semibold text-zinc-600 transition hover:bg-zinc-100/90 hover:text-zinc-900 active:scale-95 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:text-xs"
        >
          <Maximize2 className="size-3 sm:size-3.5" aria-hidden />
          <span className="hidden sm:inline">Fit</span>
        </button>
      </motion.div>

      <motion.div
        className={`min-h-0 flex-1 overflow-auto px-3 py-10 pb-20 transition-colors duration-300 sm:px-4 sm:py-12 sm:pb-24 lg:px-5 lg:py-14 xl:px-6 xl:py-16 ${
          canvasDragOver ? "bg-violet-50/40" : ""
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: automationEase }}
        onDragOver={handleCanvasDragOver}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setCanvasDragOver(false);
        }}
        onDrop={handleBlockDrop}
      >
        <motion.div
          className="mx-auto flex w-full flex-col items-center"
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
        >
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
              className="flex w-full flex-col items-center"
              variants={flowListStagger}
              initial="hidden"
              animate="show"
              onDragOver={handleCanvasDragOver}
              onDrop={handleBlockDrop}
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
                        isPressing={pressingIndex === 0}
                        reorderLocked={isWorkflowNodeReorderLocked(nodes, 0)}
                      />,
                    )}
                    {flowSegments.length > 0 ? (
                      <>
                        <TriggerFlowConnector />
                        <div className="relative w-full rounded-[1.25rem] border-2 border-dashed border-zinc-300/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/90 sm:left-4 sm:top-4 sm:px-3 sm:text-[0.6875rem]">
                            <span
                              className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]"
                              aria-hidden
                            />
                            Live
                          </span>
                          <div className="mt-10 flex flex-col gap-3 sm:mt-11 sm:gap-4">
                            {renderSegmentList(flowSegments)}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                  {splitLayout.hasSplit ? (
                    <div className={`mt-6 ${FLOW_TREE_WIDTH}`}>
                      {renderSplitBranches()}
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
                  onDrop={handleBlockDrop}
                />
              ) : null}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {canReorder && nodes.length > 0 ? (
        <p className="pointer-events-none absolute bottom-14 left-0 right-0 px-3 text-center text-[10px] font-medium text-zinc-500 sm:bottom-16 sm:text-[11px]">
          {hasCronTriggerNode(nodes)
            ? "Cron Job stays at the start. Press and hold other steps to reorder."
            : "Press and hold a step, then drag to reorder"}
        </p>
      ) : null}

      {dragGhost}
    </motion.div>
  );
}
