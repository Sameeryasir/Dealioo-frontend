import { automationFetch } from "@/app/services/automation/automation-fetch";
import type {
  AutomationConnection,
  AutomationNode,
  CreateAutomationNodeBody,
  FunnelAutomationGraph,
  UpdateAutomationNodeBody,
} from "@/app/services/automation/types";
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

const BLOCK_TO_NODE_TYPE: Record<WorkflowNodeKind, ApiNodeType> = {
  signup_trigger: "trigger",
  payment_trigger: "trigger",
  funnel_complete: "trigger",
  wait: "wait",
  delay: "wait",
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
    return "signup_trigger";
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
  const nextBySource = new Map<number, number>();
  for (const c of connections) {
    nextBySource.set(c.sourceNodeId, c.targetNodeId);
  }

  const ordered: AutomationNode[] = [];
  const visited = new Set<number>();

  const roots = nodes
    .filter((n) => !targetIds.has(n.id))
    .sort((a, b) => a.order - b.order);
  const starts =
    roots.length > 0 ? roots : [...nodes].sort((a, b) => a.order - b.order);

  for (const root of starts) {
    let currentId: number | undefined = root.id;
    while (currentId != null && !visited.has(currentId)) {
      const node = byId.get(currentId);
      if (!node) break;
      visited.add(currentId);
      ordered.push(node);
      currentId = nextBySource.get(currentId);
    }
  }

  const remaining = [...nodes]
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => a.order - b.order);
  return [...ordered, ...remaining];
}

export function mapAutomationGraphToWorkflowNodes(
  nodes: AutomationNode[],
  connections: AutomationConnection[],
): WorkflowNode[] {
  return orderNodesByConnections(nodes, connections).map(mapApiNodeToWorkflowNode);
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
