import type { WorkflowNode } from "@/app/components/automation/types";
import { resolvePrepaidFalseLoopTargetNode } from "@/app/components/automation/builder/bundled-actions";
import { buildFlowSegments, type FlowSegment } from "@/app/components/automation/builder/flow-segments";

export const FLOW_BRANCH_PASS = "pass";
export const FLOW_BRANCH_PAYMENT = "payment";
export const FLOW_BRANCH_VISITED_YES = "visited_yes";
export const FLOW_BRANCH_VISITED_NO = "visited_no";

export const FLOW_BRANCH_WALLET_REMINDER = "wallet_reminder";
export const FLOW_BRANCH_FOLLOW_UP = "follow_up";

export const FLOW_BRANCH_OFFER_EXPIRY = "offer_expiry";
export const FLOW_BRANCH_OFFER_EXPIRY_3D = "offer_expiry_3d";
export const FLOW_BRANCH_OFFER_EXPIRY_TOMORROW = "offer_expiry_tomorrow";
export const FLOW_BRANCH_WEEKEND_PASS = "weekend_pass";

export const FLOW_BRANCH_EXTEND_OFFER = "extend_offer";
export const FLOW_BRANCH_WHY_DIDNT_COME = "why_didnt_come";

export const FLOW_BRANCH_PAYMENT_REMINDER = "payment_reminder";
export const FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION = "payment_reminder_escalation";
export const FLOW_BRANCH_QR_PASS_GUIDE = "qr_pass_guide";

export type FlowBranchId =
  | typeof FLOW_BRANCH_PASS
  | typeof FLOW_BRANCH_PAYMENT
  | typeof FLOW_BRANCH_VISITED_YES
  | typeof FLOW_BRANCH_VISITED_NO
  | typeof FLOW_BRANCH_WALLET_REMINDER
  | typeof FLOW_BRANCH_FOLLOW_UP
  | typeof FLOW_BRANCH_OFFER_EXPIRY
  | typeof FLOW_BRANCH_OFFER_EXPIRY_3D
  | typeof FLOW_BRANCH_OFFER_EXPIRY_TOMORROW
  | typeof FLOW_BRANCH_WEEKEND_PASS
  | typeof FLOW_BRANCH_EXTEND_OFFER
  | typeof FLOW_BRANCH_WHY_DIDNT_COME
  | typeof FLOW_BRANCH_PAYMENT_REMINDER
  | typeof FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION
  | typeof FLOW_BRANCH_QR_PASS_GUIDE;

export type IndexedWorkflowNode = {
  node: WorkflowNode;
  index: number;
};

export type ParallelBranchDef = {
  id: string;
  title: string;
};

export type ParallelFlowTree = {
  head: IndexedWorkflowNode[];
  parallelSplit: IndexedWorkflowNode | null;
  branches: ParallelBranchColumn[];
};

export type ParallelBranchColumn = {
  id: string;
  title: string;
  nodes: IndexedWorkflowNode[];
  content: ParallelFlowTree;
};

export type FlowBranchColumn = {
  id: string;
  title: string;
  nodes: IndexedWorkflowNode[];
};

export function isParallelSplitNode(node: WorkflowNode): boolean {
  return (
    node.kind === "parallel_split" ||
    ((node.kind === "wait" || node.kind === "delay") &&
      node.config?.isParallelSplit === true)
  );
}

export function getParallelBranchDefs(
  node: WorkflowNode | null | undefined,
): ParallelBranchDef[] {
  if (!node || !isParallelSplitNode(node)) return [];
  const raw = node.config.branches;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item !== "object" || item == null) return null;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id.trim() : "";
      if (!id) return null;
      const title =
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : humanizeBranchId(id);
      return { id, title };
    })
    .filter((item): item is ParallelBranchDef => item != null);
}

function humanizeBranchId(id: string): string {
  return id
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFlowBranch(node: WorkflowNode): FlowBranchId | null {
  const branch = node.config?.flowBranch;
  if (
    branch === FLOW_BRANCH_PASS ||
    branch === FLOW_BRANCH_PAYMENT ||
    branch === FLOW_BRANCH_VISITED_YES ||
    branch === FLOW_BRANCH_VISITED_NO ||
    branch === FLOW_BRANCH_WALLET_REMINDER ||
    branch === FLOW_BRANCH_FOLLOW_UP ||
    branch === FLOW_BRANCH_OFFER_EXPIRY ||
    branch === FLOW_BRANCH_OFFER_EXPIRY_3D ||
    branch === FLOW_BRANCH_OFFER_EXPIRY_TOMORROW ||
    branch === FLOW_BRANCH_WEEKEND_PASS ||
    branch === FLOW_BRANCH_EXTEND_OFFER ||
    branch === FLOW_BRANCH_WHY_DIDNT_COME ||
    branch === FLOW_BRANCH_PAYMENT_REMINDER ||
    branch === FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION ||
    branch === FLOW_BRANCH_QR_PASS_GUIDE
  ) {
    return branch;
  }
  return null;
}

function getFlowBranchKey(node: WorkflowNode): string | null {
  const branch = node.config?.flowBranch;
  if (typeof branch !== "string") return null;
  const key = branch.trim();
  return key.length > 0 ? key : null;
}

function getFlowBranchParent(node: WorkflowNode): string | null {
  const parent = node.config?.flowBranchParent;
  if (typeof parent !== "string") return null;
  const key = parent.trim();
  return key.length > 0 ? key : null;
}

export function isCustomerVisitedFilterNode(node: WorkflowNode): boolean {
  const conditionType = String(
    node.config?.conditionType ?? node.config?.type ?? "",
  )
    .trim()
    .toLowerCase();
  return (
    conditionType.includes("customer visited") ||
    conditionType.includes("visited business") ||
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

    head.push(entry);
  });

  loopTarget = (() => {
    const targetNode = resolvePrepaidFalseLoopTargetNode(flowNodes);
    if (!targetNode) {
      return null;
    }
    const index = flowNodes.indexOf(targetNode);
    if (index < 0) {
      return null;
    }
    return { node: targetNode, index: startIndex + index };
  })();

  const hasTemplateVisitedBranch = flowNodes.some(
    (node) => getFlowBranch(node) === FLOW_BRANCH_VISITED_YES,
  );
  const hasSplit =
    hasTemplateVisitedBranch &&
    visitFilterIndex >= 0 &&
    visitedYes.length > 0 &&
    loopTarget != null;

  return { head, visitedYes, loopTarget, hasSplit };
}

export function parsePaymentReminderSplitLayout(
  flowNodes: WorkflowNode[],
  startIndex: number,
): {
  head: IndexedWorkflowNode[];
  loopTarget: IndexedWorkflowNode | null;
  hasSplit: boolean;
} {
  const head: IndexedWorkflowNode[] = flowNodes.map((node, offset) => ({
    node,
    index: startIndex + offset,
  }));

  return {
    head,
    loopTarget: null,
    hasSplit: false,
  };
}

export function parseParallelFlowTree(
  entries: IndexedWorkflowNode[],
): ParallelFlowTree {
  const branchParentMap = new Map<string, string>();
  for (const { node } of entries) {
    const key = getFlowBranchKey(node);
    if (isParallelSplitNode(node) && key != null) {
      for (const def of getParallelBranchDefs(node)) {
        branchParentMap.set(def.id, key);
      }
    }
    const parent = getFlowBranchParent(node);
    if (key != null && parent != null && !branchParentMap.has(key)) {
      branchParentMap.set(key, parent);
    }
  }

  const head: IndexedWorkflowNode[] = [];
  let parallelSplit: IndexedWorkflowNode | null = null;
  const childOrder: string[] = [];
  const childTitles = new Map<string, string>();
  const childNodes = new Map<string, IndexedWorkflowNode[]>();

  for (const entry of entries) {
    const { node } = entry;

    if (isParallelSplitNode(node) && parallelSplit == null) {
      parallelSplit = entry;
      for (const def of getParallelBranchDefs(node)) {
        childTitles.set(def.id, def.title);
        if (!childNodes.has(def.id)) {
          childNodes.set(def.id, []);
          childOrder.push(def.id);
        }
      }
      continue;
    }

    if (parallelSplit != null) {
      const owner = resolveChildColumnOwner(
        getFlowBranchKey(node),
        getFlowBranchParent(node),
        childNodes,
        branchParentMap,
      );
      if (owner != null) {
        childNodes.get(owner)!.push(entry);
      }
      continue;
    }

    head.push(entry);
  }

  const branches: ParallelBranchColumn[] = childOrder.map((id) => {
    const nodes = childNodes.get(id) ?? [];
    return {
      id,
      title: childTitles.get(id) ?? humanizeBranchId(id),
      nodes,
      content: parseParallelFlowTree(nodes),
    };
  });

  return { head, parallelSplit, branches };
}

function resolveChildColumnOwner(
  branchId: string | null,
  parentHint: string | null,
  childNodes: Map<string, IndexedWorkflowNode[]>,
  branchParentMap: Map<string, string>,
): string | null {
  if (branchId != null && childNodes.has(branchId)) return branchId;

  let cursor = parentHint ?? (branchId != null ? branchParentMap.get(branchId) ?? null : null);
  const seen = new Set<string>();
  while (cursor != null && !seen.has(cursor)) {
    if (childNodes.has(cursor)) return cursor;
    seen.add(cursor);
    cursor = branchParentMap.get(cursor) ?? null;
  }
  return null;
}

function resolveTopLevelBranchId(
  branchId: string | null,
  parentHint: string | null,
  topIds: Set<string>,
  branchParentMap: Map<string, string>,
): string | null {
  let cursor = parentHint ?? branchId;
  const seen = new Set<string>();
  while (cursor != null && !seen.has(cursor)) {
    if (topIds.has(cursor)) return cursor;
    seen.add(cursor);
    cursor = branchParentMap.get(cursor) ?? null;
  }
  if (branchId != null && topIds.has(branchId)) return branchId;
  return null;
}

export function parseSplitFlowLayout(
  flowNodes: WorkflowNode[],
  startIndex: number,
): {
  head: IndexedWorkflowNode[];
  tail: IndexedWorkflowNode[];
  parallelSplit: IndexedWorkflowNode | null;
  branches: Record<FlowBranchId, IndexedWorkflowNode[]>;
  branchColumns: ParallelBranchColumn[];
  tree: ParallelFlowTree;
  hasSplit: boolean;
} {
  const entries: IndexedWorkflowNode[] = flowNodes.map((node, offset) => ({
    node,
    index: startIndex + offset,
  }));

  const branchesRecord: Record<FlowBranchId, IndexedWorkflowNode[]> = {
    [FLOW_BRANCH_PASS]: [],
    [FLOW_BRANCH_PAYMENT]: [],
    [FLOW_BRANCH_VISITED_YES]: [],
    [FLOW_BRANCH_VISITED_NO]: [],
    [FLOW_BRANCH_WALLET_REMINDER]: [],
    [FLOW_BRANCH_FOLLOW_UP]: [],
    [FLOW_BRANCH_OFFER_EXPIRY]: [],
    [FLOW_BRANCH_OFFER_EXPIRY_3D]: [],
    [FLOW_BRANCH_OFFER_EXPIRY_TOMORROW]: [],
    [FLOW_BRANCH_WEEKEND_PASS]: [],
    [FLOW_BRANCH_EXTEND_OFFER]: [],
    [FLOW_BRANCH_WHY_DIDNT_COME]: [],
    [FLOW_BRANCH_PAYMENT_REMINDER]: [],
    [FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION]: [],
    [FLOW_BRANCH_QR_PASS_GUIDE]: [],
  };

  let topSplit: IndexedWorkflowNode | null = null;
  const topTitles = new Map<string, string>();
  const topOrder: string[] = [];
  const topBucket = new Map<string, IndexedWorkflowNode[]>();
  const head: IndexedWorkflowNode[] = [];
  const tail: IndexedWorkflowNode[] = [];
  const branchParentMap = new Map<string, string>();

  for (const entry of entries) {
    const { node } = entry;
    const branchKey = getFlowBranchKey(node);

    if (isParallelSplitNode(node) && branchKey == null) {
      topSplit = entry;
      for (const def of getParallelBranchDefs(node)) {
        topTitles.set(def.id, def.title);
        if (!topBucket.has(def.id)) {
          topBucket.set(def.id, []);
          topOrder.push(def.id);
        }
      }
      continue;
    }

    if (isParallelSplitNode(node)) {
      const parentId = branchKey;
      if (parentId != null) {
        for (const def of getParallelBranchDefs(node)) {
          branchParentMap.set(def.id, parentId);
        }
      }
    }
  }

  for (const entry of entries) {
    const key = getFlowBranchKey(entry.node);
    const parent = getFlowBranchParent(entry.node);
    if (key != null && parent != null && !branchParentMap.has(key)) {
      branchParentMap.set(key, parent);
    }
  }

  if (topOrder.length === 0) {
    for (const entry of entries) {
      const key = getFlowBranchKey(entry.node);
      const parent = getFlowBranchParent(entry.node);
      if (key == null || parent != null || isParallelSplitNode(entry.node)) {
        continue;
      }
      if (!topBucket.has(key)) {
        topBucket.set(key, []);
        topOrder.push(key);
        topTitles.set(key, humanizeBranchId(key));
      }
    }
  }

  const topIds = new Set(topOrder);
  const topSplitEntryIndex =
    topSplit != null
      ? entries.findIndex((entry) => entry.index === topSplit.index)
      : -1;

  for (const entry of entries) {
    const { node } = entry;
    const branchKey = getFlowBranchKey(node);
    const parentKey = getFlowBranchParent(node);

    if (isParallelSplitNode(node) && branchKey == null) {
      continue;
    }

    const topId = resolveTopLevelBranchId(
      branchKey,
      parentKey,
      topIds,
      branchParentMap,
    );

    if (topId != null) {
      if (!topBucket.has(topId)) {
        topBucket.set(topId, []);
      }
      topBucket.get(topId)!.push(entry);
      const known = getFlowBranch(node);
      if (known != null) branchesRecord[known].push(entry);
      continue;
    }

    if (!isParallelSplitNode(node)) {
      const entryIndex = entries.indexOf(entry);
      if (
        topSplitEntryIndex >= 0 &&
        entryIndex > topSplitEntryIndex &&
        branchKey == null
      ) {
        tail.push(entry);
      } else {
        head.push(entry);
      }
    }
  }

  const branchColumns: ParallelBranchColumn[] = topOrder.map((id) => {
    const nodes = topBucket.get(id) ?? [];
    return {
      id,
      title: topTitles.get(id) ?? humanizeBranchId(id),
      nodes,
      content: parseParallelFlowTree(nodes),
    };
  });

  const tree: ParallelFlowTree = {
    head,
    parallelSplit: topSplit,
    branches: branchColumns,
  };

  const hasSplit = branchColumns.length >= 2 || topSplit != null;

  return {
    head,
    tail,
    parallelSplit: topSplit,
    branches: branchesRecord,
    branchColumns,
    tree,
    hasSplit,
  };
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

export function parallelTreeHasNestedSplit(tree: ParallelFlowTree): boolean {
  return tree.parallelSplit != null && tree.branches.length > 0;
}
