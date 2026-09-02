import { automationFetch } from "@/app/services/automation/automation-fetch";
import type {
  AutomationConnection,
  AutomationNode,
  CreateAutomationNodeBody,
  FunnelAutomationGraph,
  UpdateAutomationNodeBody,
} from "@/app/services/automation/types";
import { defaultParallelSplitConfig } from "@/app/components/automation/builder/workflow-branch-context";
import { enforceCronTriggerFirst } from "@/app/components/automation/workflow-node-order";
import { getBlockByKind } from "@/app/components/automation/mock-data";
import type {
  WorkflowNode,
  WorkflowNodeKind,
} from "@/app/components/automation/types";

export const API_NODE_TYPES = [
  "trigger",
  "wait",
  "email",
  "sms",
  "whatsapp",
  "condition",
  "coupon",
  "tag",
] as const;

export type ApiNodeType = (typeof API_NODE_TYPES)[number];

export const SIGNUP_TRIGGER_DEFAULT_CONFIG: Record<string, unknown> = {
  trigger: "signup",
};

const TRIGGER_DEFAULT_CONFIG_BY_KIND: Partial<
  Record<WorkflowNodeKind, Record<string, unknown>>
> = {
  signup_trigger: SIGNUP_TRIGGER_DEFAULT_CONFIG,
  payment_trigger: { trigger: "payment" },
  funnel_complete: { trigger: "funnel_complete" },
  cron_trigger: {
    trigger: "cron",
    frequency: "daily",
    time: "09:00",
    dayOfWeek: "monday",
    interval: 5,
    unit: "minutes",
  },
};

const TRIGGER_BLOCK_KINDS = new Set<WorkflowNodeKind>(
  Object.keys(TRIGGER_DEFAULT_CONFIG_BY_KIND) as WorkflowNodeKind[],
);

export function isTriggerBlockKind(kind: WorkflowNodeKind): boolean {
  return TRIGGER_BLOCK_KINDS.has(kind);
}

export function defaultConfigForBlockKind(
  kind: WorkflowNodeKind,
  options?: { nestUnderBranchId?: string | null },
): Record<string, unknown> {
  if (kind === "parallel_split") {
    return defaultParallelSplitConfig(options?.nestUnderBranchId ?? null);
  }
  return TRIGGER_DEFAULT_CONFIG_BY_KIND[kind] ?? {};
}

const BLOCK_TO_NODE_TYPE: Record<WorkflowNodeKind, ApiNodeType> = {
  signup_trigger: "trigger",
  payment_trigger: "trigger",
  funnel_complete: "trigger",
  cron_trigger: "trigger",
  wait: "wait",
  delay: "wait",
  parallel_split: "wait",
  send_email: "email",
  send_sms: "sms",
  send_whatsapp: "whatsapp",
  condition: "condition",
  create_coupon: "coupon",
  tag_customer: "tag",
  reviews: "tag",
};

const NODE_TYPE_TO_BLOCK_KIND: Record<ApiNodeType, WorkflowNodeKind> = {
  trigger: "signup_trigger",
  wait: "wait",
  email: "send_email",
  sms: "send_sms",
  whatsapp: "send_whatsapp",
  condition: "condition",
  coupon: "create_coupon",
  tag: "tag_customer",
};

export function blockKindToNodeType(kind: WorkflowNodeKind): ApiNodeType {
  return BLOCK_TO_NODE_TYPE[kind];
}

export function nodeTypeToBlockKind(
  type: string,
  config?: Record<string, unknown>,
): WorkflowNodeKind {
  if (type === "trigger") {
    const trigger = config?.trigger;
    if (trigger === "payment") return "payment_trigger";
    if (trigger === "funnel_complete") return "funnel_complete";
    if (trigger === "cron") return "cron_trigger";
    if (trigger === "abandoned_checkout") return "signup_trigger";
    return "signup_trigger";
  }
  if (type === "wait" && config?.isParallelSplit === true) {
    return "parallel_split";
  }
  if (API_NODE_TYPES.includes(type as ApiNodeType)) {
    return NODE_TYPE_TO_BLOCK_KIND[type as ApiNodeType];
  }
  return "wait";
}

export function mapApiNodeToWorkflowNode(node: AutomationNode): WorkflowNode {
  const kind = nodeTypeToBlockKind(node.type, node.config);
  const block = getBlockByKind(kind);
  return {
    id: String(node.id),
    numericId: node.id,
    automationId: node.automationId,
    kind,
    label: block.label,
    config: node.config ?? {},
  };
}

function orderNodesByConnections(
  nodes: AutomationNode[],
  connections: AutomationConnection[],
): AutomationNode[] {
  if (nodes.length === 0) return [];
  if (connections.length === 0) {
    return [...nodes].sort((a, b) => a.order - b.order);
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const targetIds = new Set(connections.map((c) => c.targetNodeId));
  const nextBySource = new Map<number, number[]>();
  for (const connection of connections) {
    const list = nextBySource.get(connection.sourceNodeId) ?? [];
    if (!list.includes(connection.targetNodeId)) {
      list.push(connection.targetNodeId);
    }
    nextBySource.set(connection.sourceNodeId, list);
  }

  for (const [sourceId, targets] of nextBySource) {
    targets.sort((a, b) => {
      const orderA = byId.get(a)?.order ?? 0;
      const orderB = byId.get(b)?.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a - b;
    });
    nextBySource.set(sourceId, targets);
  }

  const ordered: AutomationNode[] = [];
  const visited = new Set<number>();

  const walk = (nodeId: number) => {
    if (visited.has(nodeId)) return;
    const node = byId.get(nodeId);
    if (!node) return;
    visited.add(nodeId);
    ordered.push(node);
    for (const nextId of nextBySource.get(nodeId) ?? []) {
      walk(nextId);
    }
  };

  const roots = nodes
    .filter((n) => !targetIds.has(n.id))
    .sort((a, b) => a.order - b.order || a.id - b.id);
  const starts =
    roots.length > 0 ? roots : [...nodes].sort((a, b) => a.order - b.order);

  for (const root of starts) {
    walk(root.id);
  }

  const remaining = [...nodes]
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => a.order - b.order || a.id - b.id);
  return [...ordered, ...remaining];
}

export function mapAutomationGraphToWorkflowNodes(
  nodes: AutomationNode[],
  connections: AutomationConnection[],
): WorkflowNode[] {
  const ordered = orderNodesByConnections(nodes, connections).map(
    mapApiNodeToWorkflowNode,
  );
  return enforceCronTriggerFirst(ordered);
}

export function mapFunnelGraphToWorkflowNodes(
  graph: FunnelAutomationGraph,
): WorkflowNode[] {
  return mapAutomationGraphToWorkflowNodes(graph.nodes, graph.connections);
}

export async function getAutomationNodesByFunnel(
  funnelId: number,
): Promise<FunnelAutomationGraph> {
  return automationFetch<FunnelAutomationGraph>(
    `/node/funnel/${encodeURIComponent(String(funnelId))}`,
  );
}

export async function createAutomationNode(
  body: CreateAutomationNodeBody,
): Promise<AutomationNode> {
  return automationFetch<AutomationNode>("/node", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function automationNodePath(nodeId: number): string {
  return `/node/${encodeURIComponent(String(nodeId))}`;
}

export async function updateAutomationNode(
  nodeId: number,
  body: UpdateAutomationNodeBody,
): Promise<AutomationNode> {
  return automationFetch<AutomationNode>(automationNodePath(nodeId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAutomationNode(nodeId: number): Promise<void> {
  await automationFetch<void>(automationNodePath(nodeId), {
    method: "DELETE",
  });
}
