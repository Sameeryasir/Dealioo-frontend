import { reorderList } from "@/app/lib/reorder-list";
import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";
import {
  getNodeBranchPlacement,
  isParallelSplitWorkflowNode,
  type WorkflowBranchTarget,
  type WorkflowDropPlacement,
} from "@/app/components/automation/builder/workflow-branch-context";

const TRIGGER_NODE_KINDS = new Set<WorkflowNodeKind>([
  "signup_trigger",
  "payment_trigger",
  "funnel_complete",
  "cron_trigger",
]);

export function isTriggerWorkflowKind(kind: WorkflowNodeKind): boolean {
  return TRIGGER_NODE_KINDS.has(kind);
}

export function isTriggerWorkflowNode(node: WorkflowNode): boolean {
  return isTriggerWorkflowKind(node.kind);
}

export function isCronTriggerNode(node: WorkflowNode): boolean {
  return node.kind === "cron_trigger";
}

export function getTriggerNodeIndex(nodes: WorkflowNode[]): number | null {
  const index = nodes.findIndex(isTriggerWorkflowNode);
  return index >= 0 ? index : null;
}

export function getCronTriggerIndex(nodes: WorkflowNode[]): number | null {
  const index = nodes.findIndex(isCronTriggerNode);
  return index >= 0 ? index : null;
}

export function hasTriggerNode(nodes: WorkflowNode[]): boolean {
  return getTriggerNodeIndex(nodes) != null;
}

export function hasCronTriggerNode(nodes: WorkflowNode[]): boolean {
  return getCronTriggerIndex(nodes) != null;
}

export function isCronStartingTrigger(nodes: WorkflowNode[]): boolean {
  return getCronTriggerIndex(nodes) === 0;
}

export function isSignupTriggerNode(node: WorkflowNode): boolean {
  return node.kind === "signup_trigger";
}

export function isSignupStartingTrigger(nodes: WorkflowNode[]): boolean {
  return nodes.length > 0 && isSignupTriggerNode(nodes[0]);
}

export function isPaymentTriggerNode(node: WorkflowNode): boolean {
  return node.kind === "payment_trigger";
}

export function isPaymentStartingTrigger(nodes: WorkflowNode[]): boolean {
  return nodes.length > 0 && isPaymentTriggerNode(nodes[0]);
}

export function isManualRunDisabledFlow(nodes: WorkflowNode[]): boolean {
  return (
    isCronStartingTrigger(nodes) ||
    isSignupStartingTrigger(nodes) ||
    isPaymentStartingTrigger(nodes)
  );
}

export function isWorkflowNodeReorderLocked(
  nodes: WorkflowNode[],
  index: number,
): boolean {
  return getTriggerNodeIndex(nodes) === index;
}

export function enforceTriggerFirst(nodes: WorkflowNode[]): WorkflowNode[] {
  const triggerIndex = getTriggerNodeIndex(nodes);
  if (triggerIndex == null || triggerIndex === 0) return nodes;

  const next = [...nodes];
  const [triggerNode] = next.splice(triggerIndex, 1);
  next.unshift(triggerNode);
  return next;
}

export function enforceCronTriggerFirst(nodes: WorkflowNode[]): WorkflowNode[] {
  return enforceTriggerFirst(nodes);
}

export function clampWorkflowDropIndex(
  nodes: WorkflowNode[],
  toIndex: number,
  fromIndex: number,
): number {
  const bounded = Math.max(0, Math.min(toIndex, nodes.length));
  const triggerIndex = getTriggerNodeIndex(nodes);
  if (triggerIndex == null) return bounded;
  if (fromIndex === triggerIndex) return triggerIndex;
  if (bounded <= triggerIndex) return triggerIndex + 1;
  return bounded;
}

export function reorderWorkflowNodes(
  nodes: WorkflowNode[],
  fromIndex: number,
  toIndex: number,
): WorkflowNode[] {
  if (fromIndex < 0 || fromIndex >= nodes.length) return nodes;
  if (isWorkflowNodeReorderLocked(nodes, fromIndex)) return nodes;

  const clampedTo = clampWorkflowDropIndex(nodes, toIndex, fromIndex);
  if (fromIndex === clampedTo) return nodes;
  return reorderList(nodes, fromIndex, clampedTo);
}

export function getTopLevelParallelSplitIndex(nodes: WorkflowNode[]): number | null {
  const index = nodes.findIndex(
    (node) =>
      isParallelSplitWorkflowNode(node) && getNodeBranchPlacement(node) == null,
  );
  return index >= 0 ? index : null;
}

export function insertWorkflowNode(
  nodes: WorkflowNode[],
  node: WorkflowNode,
  insertIndex?: number,
): WorkflowNode[] {
  if (isTriggerWorkflowNode(node)) {
    const withoutTrigger = nodes.filter((existing) => !isTriggerWorkflowNode(existing));
    return [node, ...withoutTrigger];
  }

  if (insertIndex == null || insertIndex >= nodes.length) {
    return [...nodes, node];
  }

  const next = [...nodes];
  next.splice(insertIndex, 0, node);
  return next;
}

export function getWorkflowNodeInsertIndex(
  nodes: WorkflowNode[],
  kind: WorkflowNode["kind"],
  dropPlacement?: WorkflowDropPlacement | null,
  branchTarget?: WorkflowBranchTarget | null,
  insertAfterNodeId?: string | null,
): number {
  if (isTriggerWorkflowKind(kind)) {
    return 0;
  }

  if (insertAfterNodeId) {
    const afterIndex = nodes.findIndex((node) => node.id === insertAfterNodeId);
    if (afterIndex >= 0) {
      return afterIndex + 1;
    }
  }

  if (branchTarget?.flowBranch) {
    let lastInBranch = -1;
    for (let i = 0; i < nodes.length; i++) {
      const placement = getNodeBranchPlacement(nodes[i]!);
      if (
        placement?.flowBranch === branchTarget.flowBranch &&
        (branchTarget.flowBranchParent == null ||
          placement.flowBranchParent === branchTarget.flowBranchParent)
      ) {
        lastInBranch = i;
      }
    }
    if (lastInBranch >= 0) {
      return lastInBranch + 1;
    }

    const splitIndex = getTopLevelParallelSplitIndex(nodes);
    if (splitIndex != null) {
      for (let i = splitIndex + 1; i < nodes.length; i++) {
        const node = nodes[i]!;
        if (
          !isParallelSplitWorkflowNode(node) &&
          getNodeBranchPlacement(node) == null
        ) {
          return i;
        }
      }
    }
    return nodes.length;
  }

  if (dropPlacement === "after_parallel_split") {
    return nodes.length;
  }

  if (dropPlacement === "main_flow") {
    const splitIndex = getTopLevelParallelSplitIndex(nodes);
    return splitIndex != null ? splitIndex : nodes.length;
  }

  return nodes.length;
}

export function canAddTriggerBlock(
  nodes: WorkflowNode[],
  kind: WorkflowNodeKind,
): boolean {
  if (!isTriggerWorkflowKind(kind)) {
    return true;
  }
  return !hasTriggerNode(nodes);
}
