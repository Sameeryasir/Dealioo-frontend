import {
  expandBundledActions,
  isBundledActionsNode,
} from "@/app/components/automation/builder/bundled-actions";
import { isUserCreatedActionNode } from "@/app/components/automation/builder/action-node-defaults";
import {
  buildDesiredAutomationConnectionPairs,
  getNodeBranchPlacement,
  isParallelSplitWorkflowNode,
  nodeMatchesBranchTarget,
  parseParallelBranchesFromConfig,
  type WorkflowBranchTarget,
} from "@/app/components/automation/builder/workflow-branch-context";
import { resolveWaitDelayMinutesFromConfig } from "@/app/components/automation/payment-reminder-schedule-validation";
import type { WorkflowNode } from "@/app/components/automation/types";
import type { AutomationConnection } from "@/app/services/automation/types";
import { isTriggerWorkflowKind } from "@/app/components/automation/workflow-node-order";

export type WorkflowActivationValidation =
  | { ok: true }
  | {
      ok: false;
      message: string;
      invalidNodeIds: string[];
      invalidStepIds: string[];
      firstInvalidNodeId: string | null;
    };

function hasText(value: unknown): boolean {
  return String(value ?? "").trim().length > 0;
}

function validateEmailNode(node: WorkflowNode): boolean {
  if (!hasText(node.config.subject) || !hasText(node.config.message)) {
    return false;
  }
  if (!isUserCreatedActionNode(node)) {
    return true;
  }
  return hasText(node.config.ctaLabel) || hasText(node.config.linkLabel);
}

function validateSmsNode(node: WorkflowNode): boolean {
  if (hasText(node.config.message)) {
    return true;
  }
  if (!isUserCreatedActionNode(node)) {
    return hasText(node.config.linkLabel ?? node.config.ctaLabel);
  }
  return false;
}

function isParallelSplitMarker(node: WorkflowNode): boolean {
  return (
    node.kind === "parallel_split" ||
    node.config?.isParallelSplit === true
  );
}

function validateWaitNode(node: WorkflowNode): boolean {
  if (isParallelSplitMarker(node)) {
    return true;
  }
  return resolveWaitDelayMinutesFromConfig(node.config) > 0;
}

function validateConditionNode(node: WorkflowNode): boolean {
  const config = node.config ?? {};

  const conditions = config.conditions;
  if (Array.isArray(conditions) && conditions.length > 0) {
    return conditions.some((row) => {
      if (!row || typeof row !== "object") {
        return false;
      }
      return hasText((row as Record<string, unknown>).value);
    });
  }

  return hasText(config.conditionType);
}

function validateActionNode(node: WorkflowNode): boolean {
  switch (node.kind) {
    case "send_email":
      return validateEmailNode(node);
    case "send_sms":
    case "send_whatsapp":
      return validateSmsNode(node);
    default:
      return true;
  }
}

function validateWorkflowNode(node: WorkflowNode): boolean {
  if (isBundledActionsNode(node)) {
    return expandBundledActions(node).every((step) => validateActionNode(step));
  }

  switch (node.kind) {
    case "send_email":
    case "send_sms":
    case "send_whatsapp":
      return validateActionNode(node);
    case "wait":
    case "delay":
      return validateWaitNode(node);
    case "condition":
      return validateConditionNode(node);
    default:
      return true;
  }
}

function nodeLabel(node: WorkflowNode): string {
  return node.label?.trim() || "Step";
}

function activationMessageForNode(node: WorkflowNode): string {
  switch (node.kind) {
    case "send_email":
      if (
        hasText(node.config.subject) &&
        hasText(node.config.message) &&
        isUserCreatedActionNode(node) &&
        !hasText(node.config.ctaLabel) &&
        !hasText(node.config.linkLabel)
      ) {
        return `Choose a button label on "${nodeLabel(node)}" before activating.`;
      }
      return `Send email needs a subject and message text. "${nodeLabel(node)}" is incomplete.`;
    case "send_sms":
    case "send_whatsapp":
      return `Message text is required. "${nodeLabel(node)}" is incomplete.`;
    case "wait":
    case "delay":
      return `Wait needs a delay greater than 0. "${nodeLabel(node)}" is incomplete.`;
    case "condition":
      return `Condition is required — choose a condition on "${nodeLabel(node)}".`;
    default:
      return `Fill in the required settings on "${nodeLabel(node)}" to activate.`;
  }
}

function findEmptyBranchPaths(nodes: WorkflowNode[]): {
  split: WorkflowNode;
  pathTitle: string;
}[] {
  const empty: { split: WorkflowNode; pathTitle: string }[] = [];

  for (const node of nodes) {
    if (!isParallelSplitWorkflowNode(node)) {
      continue;
    }
    const nestUnder = getNodeBranchPlacement(node);
    for (const branch of parseParallelBranchesFromConfig(node.config)) {
      const target: WorkflowBranchTarget = nestUnder?.flowBranch
        ? {
            flowBranch: branch.id,
            flowBranchParent: nestUnder.flowBranch,
          }
        : { flowBranch: branch.id };
      const hasStep = nodes.some(
        (candidate) =>
          candidate.id !== node.id &&
          nodeMatchesBranchTarget(candidate, target),
      );
      if (!hasStep) {
        empty.push({
          split: node,
          pathTitle: branch.title.trim() || branch.id,
        });
      }
    }
  }

  return empty;
}

function findUnreachableNodes(
  nodes: WorkflowNode[],
  connections: AutomationConnection[],
): WorkflowNode[] {
  const trigger = nodes.find((node) => isTriggerWorkflowKind(node.kind));
  if (trigger?.numericId == null) {
    return [];
  }

  const outgoing = new Map<number, number[]>();
  for (const connection of connections) {
    const list = outgoing.get(connection.sourceNodeId) ?? [];
    list.push(connection.targetNodeId);
    outgoing.set(connection.sourceNodeId, list);
  }

  const reachable = new Set<number>();
  const queue = [trigger.numericId];
  reachable.add(trigger.numericId);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of outgoing.get(current) ?? []) {
      if (reachable.has(next)) {
        continue;
      }
      reachable.add(next);
      queue.push(next);
    }
  }

  return nodes.filter(
    (node) =>
      node.numericId != null &&
      node.id !== trigger.id &&
      !reachable.has(node.numericId),
  );
}

function findMissingDesiredWires(
  nodes: WorkflowNode[],
  connections: AutomationConnection[],
): { sourceNodeId: number; targetNodeId: number }[] {
  const existing = new Set(
    connections.map(
      (connection) =>
        `${connection.sourceNodeId}->${connection.targetNodeId}`,
    ),
  );
  return buildDesiredAutomationConnectionPairs(nodes).filter(
    (pair) => !existing.has(`${pair.sourceNodeId}->${pair.targetNodeId}`),
  );
}

export function validateWorkflowForActivation(
  nodes: WorkflowNode[],
  connections: AutomationConnection[] = [],
): WorkflowActivationValidation {
  const invalidNodeIds = new Set<string>();
  const invalidStepIds = new Set<string>();
  let message: string | null = null;
  let firstInvalidNodeId: string | null = null;

  const markInvalid = (node: WorkflowNode, errorMessage: string) => {
    invalidNodeIds.add(node.id);
    invalidStepIds.add(node.id);
    if (!message) {
      message = errorMessage;
      firstInvalidNodeId = node.id;
    }
  };

  for (const node of nodes) {
    if (isBundledActionsNode(node)) {
      for (const step of expandBundledActions(node)) {
        if (!validateActionNode(step)) {
          invalidNodeIds.add(node.id);
          invalidStepIds.add(step.id);
          if (!message) {
            message = activationMessageForNode(node);
            firstInvalidNodeId = node.id;
          }
        }
      }
      continue;
    }

    if (!validateWorkflowNode(node)) {
      markInvalid(node, activationMessageForNode(node));
    }
  }

  for (const empty of findEmptyBranchPaths(nodes)) {
    markInvalid(
      empty.split,
      `Add at least one step to "${empty.pathTitle}" before activating.`,
    );
  }

  if (connections.length > 0 || nodes.some((node) => node.numericId != null)) {
    const missingWires = findMissingDesiredWires(nodes, connections);
    if (missingWires.length > 0) {
      const byNumericId = new Map(
        nodes
          .filter((node) => node.numericId != null)
          .map((node) => [node.numericId!, node]),
      );
      for (const pair of missingWires) {
        const source = byNumericId.get(pair.sourceNodeId);
        const target = byNumericId.get(pair.targetNodeId);
        const focus = target ?? source;
        if (!focus) {
          continue;
        }
        markInvalid(
          focus,
          `Connect "${nodeLabel(source ?? focus)}" to "${nodeLabel(target ?? focus)}" before activating.`,
        );
      }
    }

    for (const orphan of findUnreachableNodes(nodes, connections)) {
      markInvalid(
        orphan,
        `"${nodeLabel(orphan)}" is not connected to the flow. Drop it onto a path or reconnect it before activating.`,
      );
    }
  }

  if (invalidNodeIds.size === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    message: message ?? "Fill in the required settings to activate.",
    invalidNodeIds: [...invalidNodeIds],
    invalidStepIds: [...invalidStepIds],
    firstInvalidNodeId,
  };
}

export function isWorkflowNodeInvalid(
  nodeId: string,
  invalidNodeIds: ReadonlySet<string> | readonly string[],
): boolean {
  const ids =
    invalidNodeIds instanceof Set ? invalidNodeIds : new Set(invalidNodeIds);
  return ids.has(nodeId);
}

export function isWorkflowStepInvalid(
  stepId: string,
  invalidStepIds: ReadonlySet<string> | readonly string[],
): boolean {
  const ids =
    invalidStepIds instanceof Set ? invalidStepIds : new Set(invalidStepIds);
  return ids.has(stepId);
}
