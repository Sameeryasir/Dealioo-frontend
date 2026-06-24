import type { WorkflowNode } from "@/app/components/automation/types";
import { buildFlowSegments, type FlowSegment } from "@/app/components/automation/builder/flow-segments";

export const FLOW_BRANCH_PASS = "pass";
export const FLOW_BRANCH_PAYMENT = "payment";

export type FlowBranchId = typeof FLOW_BRANCH_PASS | typeof FLOW_BRANCH_PAYMENT;

export type IndexedWorkflowNode = {
  node: WorkflowNode;
  index: number;
};

function getFlowBranch(node: WorkflowNode): FlowBranchId | null {
  const branch = node.config?.flowBranch;
  if (branch === FLOW_BRANCH_PASS || branch === FLOW_BRANCH_PAYMENT) {
    return branch;
  }
  return null;
}

/** Split flow into main steps (before branches) and parallel branch columns. */
export function parseSplitFlowLayout(
  flowNodes: WorkflowNode[],
  startIndex: number,
): {
  head: IndexedWorkflowNode[];
  branches: Record<FlowBranchId, IndexedWorkflowNode[]>;
  hasSplit: boolean;
} {
  const head: IndexedWorkflowNode[] = [];
  const branches: Record<FlowBranchId, IndexedWorkflowNode[]> = {
    [FLOW_BRANCH_PASS]: [],
    [FLOW_BRANCH_PAYMENT]: [],
  };

  flowNodes.forEach((node, offset) => {
    const entry = { node, index: startIndex + offset };
    const branch = getFlowBranch(node);
    if (branch != null) {
      branches[branch].push(entry);
      return;
    }
    head.push(entry);
  });

  const hasSplit =
    branches[FLOW_BRANCH_PASS].length > 0 &&
    branches[FLOW_BRANCH_PAYMENT].length > 0;

  return { head, branches, hasSplit };
}

export function buildSegmentsForIndexedNodes(
  entries: IndexedWorkflowNode[],
): FlowSegment[] {
  if (entries.length === 0) return [];
  return buildFlowSegments(
    entries.map((entry) => entry.node),
    entries[0]!.index,
  );
}
