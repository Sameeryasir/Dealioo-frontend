import { reorderList } from "@/app/lib/reorder-list";
import type { WorkflowNode } from "@/app/components/automation/types";

export function isCronTriggerNode(node: WorkflowNode): boolean {
  return node.kind === "cron_trigger";
}

export function getCronTriggerIndex(nodes: WorkflowNode[]): number | null {
  const index = nodes.findIndex(isCronTriggerNode);
  return index >= 0 ? index : null;
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
  return getCronTriggerIndex(nodes) === index;
}

export function enforceCronTriggerFirst(nodes: WorkflowNode[]): WorkflowNode[] {
  const cronIndex = getCronTriggerIndex(nodes);
  if (cronIndex == null || cronIndex === 0) return nodes;

  const next = [...nodes];
  const [cronNode] = next.splice(cronIndex, 1);
  next.unshift(cronNode);
  return next;
}

export function clampWorkflowDropIndex(
  nodes: WorkflowNode[],
  toIndex: number,
  fromIndex: number,
): number {
  const bounded = Math.max(0, Math.min(toIndex, nodes.length));
  const cronIndex = getCronTriggerIndex(nodes);
  if (cronIndex == null) return bounded;
  if (fromIndex === cronIndex) return cronIndex;
  if (bounded <= cronIndex) return cronIndex + 1;
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

export function insertWorkflowNode(
  nodes: WorkflowNode[],
  node: WorkflowNode,
): WorkflowNode[] {
  if (isCronTriggerNode(node)) {
    const withoutCron = nodes.filter((existing) => !isCronTriggerNode(existing));
    return [node, ...withoutCron];
  }
  return [...nodes, node];
}

export function getWorkflowNodeInsertIndex(
  nodes: WorkflowNode[],
  kind: WorkflowNode["kind"],
): number {
  return kind === "cron_trigger" ? 0 : nodes.length;
}
