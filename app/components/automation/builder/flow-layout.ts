import type { WorkflowNode } from "@/app/components/automation/types";
import { isPrepaidVisitReminderWaitLoopNode } from "@/app/components/automation/builder/bundled-actions";
import { buildFlowSegments, type FlowSegment } from "@/app/components/automation/builder/flow-segments";

export const FLOW_BRANCH_PASS = "pass";
export const FLOW_BRANCH_PAYMENT = "payment";
export const FLOW_BRANCH_VISITED_YES = "visited_yes";
export const FLOW_BRANCH_VISITED_NO = "visited_no";

export type FlowBranchId =
  | typeof FLOW_BRANCH_PASS
  | typeof FLOW_BRANCH_PAYMENT
  | typeof FLOW_BRANCH_VISITED_YES
  | typeof FLOW_BRANCH_VISITED_NO;

export type IndexedWorkflowNode = {
  node: WorkflowNode;
  index: number;
};

function getFlowBranch(node: WorkflowNode): FlowBranchId | null {
  const branch = node.config?.flowBranch;
  if (
    branch === FLOW_BRANCH_PASS ||
    branch === FLOW_BRANCH_PAYMENT ||
    branch === FLOW_BRANCH_VISITED_YES ||
    branch === FLOW_BRANCH_VISITED_NO
  ) {
    return branch;
  }
  return null;
}

export function isCustomerVisitedFilterNode(node: WorkflowNode): boolean {
  const conditionType = String(
    node.config?.conditionType ?? node.config?.type ?? "",
  )
    .trim()
    .toLowerCase();
  return (
    conditionType.includes("customer visited") ||
    conditionType.includes("visited restaurant") ||
    conditionType === "visit_completed"
  );
}

export function parsePrepaidVisitSplitLayout(
  flowNodes: WorkflowNode[],
  startIndex: number,
): {
  head: IndexedWorkflowNode[];
  visitedYes: IndexedWorkflowNode[];
  loopTarget: IndexedWorkflowNode | null;
  hasSplit: boolean;
} {
  const visitFilterIndex = flowNodes.findIndex(isCustomerVisitedFilterNode);
  const head: IndexedWorkflowNode[] = [];
  const visitedYes: IndexedWorkflowNode[] = [];
  let loopTarget: IndexedWorkflowNode | null = null;

  flowNodes.forEach((node, offset) => {
    const entry = { node, index: startIndex + offset };
    const branch = getFlowBranch(node);

    if (branch === FLOW_BRANCH_VISITED_YES) {
      visitedYes.push(entry);
      return;
    }

    if (
      visitFilterIndex >= 0 &&
      offset > visitFilterIndex &&
      branch !== FLOW_BRANCH_PASS &&
      branch !== FLOW_BRANCH_PAYMENT
    ) {
      visitedYes.push(entry);
      return;
    }

    if (isPrepaidVisitReminderWaitLoopNode(node)) {
      loopTarget = entry;
    }

    head.push(entry);
  });

  const hasSplit =
    visitFilterIndex >= 0 && visitedYes.length > 0 && loopTarget != null;

  return { head, visitedYes, loopTarget, hasSplit };
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
