import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";

export type WorkflowBranchDef = {
  id: string;
  title: string;
  parentId?: string | null;
};

export type WorkflowBranchTarget = {
  flowBranch: string;
  flowBranchParent?: string | null;
};

export type WorkflowDropPlacement = "main_flow" | "after_parallel_split";

export function isParallelSplitWorkflowNode(node: WorkflowNode): boolean {
  return (
    node.kind === "parallel_split" ||
    ((node.kind === "wait" || node.kind === "delay") &&
      node.config.isParallelSplit === true)
  );
}

export function slugifyBranchId(title: string, fallbackIndex = 0): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || `branch_${fallbackIndex + 1}`;
}

export function parseParallelBranchesFromConfig(
  config: Record<string, unknown>,
): { id: string; title: string }[] {
  const raw = config.branches;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const title =
        typeof record.title === "string" && record.title.trim()
          ? record.title.trim()
          : `Branch ${index + 1}`;
      const id =
        typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : slugifyBranchId(title, index);
      return { id, title };
    })
    .filter((item): item is { id: string; title: string } => item != null);
}

export function defaultParallelSplitConfig(
  nestUnder?: string | null,
): Record<string, unknown> {
  const nestKey = String(nestUnder ?? "").trim();
  const stamp = Date.now().toString(36);
  const prefix = nestKey.length > 0 ? `${slugifyBranchId(nestKey)}_` : "";

  return {
    isParallelSplit: true,
    delay: 0,
    unit: "minutes",
    branches: [
      { id: `${prefix}path_1_${stamp}`, title: "Path 1" },
      { id: `${prefix}path_2_${stamp}`, title: "Path 2" },
    ],
  };
}

export function listWorkflowBranchDefs(nodes: WorkflowNode[]): WorkflowBranchDef[] {
  const defs = new Map<string, WorkflowBranchDef>();

  for (const node of nodes) {
    if (!isParallelSplitWorkflowNode(node)) {
      continue;
    }

    const ownerBranch = String(node.config.flowBranch ?? "").trim() || null;
    for (const branch of parseParallelBranchesFromConfig(node.config)) {
      defs.set(branch.id, {
        id: branch.id,
        title: branch.title,
        parentId: ownerBranch,
      });
    }
  }

  for (const node of nodes) {
    const flowBranch = String(node.config.flowBranch ?? "").trim();
    const flowBranchParent = String(node.config.flowBranchParent ?? "").trim();
    if (!flowBranch || defs.has(flowBranch)) {
      continue;
    }
    defs.set(flowBranch, {
      id: flowBranch,
      title: flowBranch.replace(/_/g, " "),
      parentId: flowBranchParent || null,
    });
  }

  return [...defs.values()];
}

export function getNodeBranchPlacement(node: WorkflowNode): WorkflowBranchTarget | null {
  const flowBranch = String(node.config.flowBranch ?? "").trim();
  if (!flowBranch) {
    return null;
  }

  const flowBranchParent = String(node.config.flowBranchParent ?? "").trim();
  return {
    flowBranch,
    ...(flowBranchParent ? { flowBranchParent } : {}),
  };
}

export function sameBranchTarget(
  a: WorkflowBranchTarget | null | undefined,
  b: WorkflowBranchTarget | null | undefined,
): boolean {
  if (!a?.flowBranch || !b?.flowBranch) return false;
  return (
    a.flowBranch === b.flowBranch &&
    (a.flowBranchParent ?? null) === (b.flowBranchParent ?? null)
  );
}

export function nodeMatchesBranchTarget(
  node: WorkflowNode,
  target: WorkflowBranchTarget,
): boolean {
  return sameBranchTarget(getNodeBranchPlacement(node), target);
}

export function findParallelSplitForBranch(
  nodes: WorkflowNode[],
  branchTarget: WorkflowBranchTarget,
): WorkflowNode | null {
  for (const node of nodes) {
    if (!isParallelSplitWorkflowNode(node)) continue;
    const ownsBranch = parseParallelBranchesFromConfig(node.config).some(
      (branch) => branch.id === branchTarget.flowBranch,
    );
    if (!ownsBranch) continue;

    const placement = getNodeBranchPlacement(node);
    if (branchTarget.flowBranchParent) {
      if (placement?.flowBranch === branchTarget.flowBranchParent) {
        return node;
      }
      continue;
    }
    if (placement == null) {
      return node;
    }
  }
  return null;
}

export function findPreviousNodeInBranch(
  nodes: WorkflowNode[],
  insertIndex: number,
  branchTarget: WorkflowBranchTarget,
): WorkflowNode | null {
  for (let i = insertIndex - 1; i >= 0; i--) {
    const candidate = nodes[i]!;
    if (nodeMatchesBranchTarget(candidate, branchTarget)) {
      return candidate;
    }
  }
  return findParallelSplitForBranch(nodes, branchTarget);
}

export function findNextNodeInBranch(
  nodes: WorkflowNode[],
  insertIndex: number,
  branchTarget: WorkflowBranchTarget,
): WorkflowNode | null {
  for (let i = insertIndex; i < nodes.length; i++) {
    const candidate = nodes[i]!;
    if (nodeMatchesBranchTarget(candidate, branchTarget)) {
      return candidate;
    }
  }
  return null;
}

export function resolveBranchConfigForNewNode(
  nodes: WorkflowNode[],
  selectedId: string | null,
  branchTarget?: WorkflowBranchTarget | null,
  dropPlacement?: WorkflowDropPlacement | null,
): Record<string, unknown> {
  if (dropPlacement === "after_parallel_split" || dropPlacement === "main_flow") {
    return {};
  }

  if (branchTarget?.flowBranch) {
    return {
      flowBranch: branchTarget.flowBranch,
      ...(branchTarget.flowBranchParent
        ? { flowBranchParent: branchTarget.flowBranchParent }
        : {}),
    };
  }

  if (!selectedId) {
    return {};
  }

  const selected = nodes.find((node) => node.id === selectedId);
  if (!selected || isParallelSplitWorkflowNode(selected)) {
    return {};
  }

  const placement = getNodeBranchPlacement(selected);
  if (!placement) {
    return {};
  }

  return {
    flowBranch: placement.flowBranch,
    ...(placement.flowBranchParent
      ? { flowBranchParent: placement.flowBranchParent }
      : {}),
  };
}

export function branchPlacementKey(target: WorkflowBranchTarget | null): string {
  if (!target?.flowBranch) {
    return "main";
  }
  if (target.flowBranchParent) {
    return `${target.flowBranchParent}>${target.flowBranch}`;
  }
  return target.flowBranch;
}

export function branchPlacementFromKey(
  key: string,
): WorkflowBranchTarget | null {
  if (!key || key === "main") {
    return null;
  }
  const parts = key.split(">");
  if (parts.length >= 2) {
    return {
      flowBranchParent: parts[parts.length - 2]!.trim(),
      flowBranch: parts[parts.length - 1]!.trim(),
    };
  }
  return { flowBranch: key.trim() };
}

export function branchPlacementLabel(
  target: WorkflowBranchTarget | null,
  branchDefs: WorkflowBranchDef[],
): string {
  if (!target?.flowBranch) {
    return "Main flow";
  }

  const branch = branchDefs.find((item) => item.id === target.flowBranch);
  const branchTitle = branch?.title ?? target.flowBranch.replace(/_/g, " ");

  if (target.flowBranchParent) {
    const parent = branchDefs.find((item) => item.id === target.flowBranchParent);
    const parentTitle =
      parent?.title ?? target.flowBranchParent.replace(/_/g, " ");
    return `${parentTitle} → ${branchTitle}`;
  }

  return branchTitle;
}

export function listBranchPlacementOptions(
  branchDefs: WorkflowBranchDef[],
): { value: string; label: string }[] {
  const options = [{ value: "main", label: "Main flow" }];

  for (const branch of branchDefs) {
    if (branch.parentId) {
      const parent = branchDefs.find((item) => item.id === branch.parentId);
      const parentTitle = parent?.title ?? branch.parentId.replace(/_/g, " ");
      options.push({
        value: `${branch.parentId}>${branch.id}`,
        label: `${parentTitle} → ${branch.title}`,
      });
      continue;
    }

    options.push({
      value: branch.id,
      label: branch.title,
    });
  }

  return options;
}

export function normalizeWorkflowNodeKind(node: WorkflowNode): WorkflowNodeKind {
  if (isParallelSplitWorkflowNode(node) && node.kind === "wait") {
    return "parallel_split";
  }
  return node.kind;
}

export function buildDesiredAutomationConnectionPairs(
  nodes: WorkflowNode[],
): { sourceNodeId: number; targetNodeId: number }[] {
  const pairs: { sourceNodeId: number; targetNodeId: number }[] = [];
  const seen = new Set<string>();

  const pushPair = (source: WorkflowNode, target: WorkflowNode) => {
    if (source.numericId == null || target.numericId == null) return;
    const key = `${source.numericId}->${target.numericId}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({
      sourceNodeId: source.numericId,
      targetNodeId: target.numericId,
    });
  };

  const mainFlow = nodes.filter(
    (node) => getNodeBranchPlacement(node) == null,
  );
  for (let index = 0; index < mainFlow.length - 1; index++) {
    pushPair(mainFlow[index]!, mainFlow[index + 1]!);
  }

  const branchGroups = new Map<string, WorkflowNode[]>();
  for (const node of nodes) {
    const placement = getNodeBranchPlacement(node);
    if (!placement) continue;
    const key = branchPlacementKey(placement);
    const group = branchGroups.get(key) ?? [];
    group.push(node);
    branchGroups.set(key, group);
  }
  for (const group of branchGroups.values()) {
    for (let index = 0; index < group.length - 1; index++) {
      pushPair(group[index]!, group[index + 1]!);
    }
  }

  for (const node of nodes) {
    if (!isParallelSplitWorkflowNode(node)) continue;
    const nestUnder = getNodeBranchPlacement(node);
    for (const branch of parseParallelBranchesFromConfig(node.config)) {
      const target: WorkflowBranchTarget = nestUnder?.flowBranch
        ? {
            flowBranch: branch.id,
            flowBranchParent: nestUnder.flowBranch,
          }
        : { flowBranch: branch.id };
      const firstInBranch = nodes.find(
        (candidate) =>
          nodeMatchesBranchTarget(candidate, target) &&
          !(
            isParallelSplitWorkflowNode(candidate) &&
            candidate.id === node.id
          ),
      );
      if (firstInBranch) {
        pushPair(node, firstInBranch);
      }
    }
  }

  return pairs;
}
