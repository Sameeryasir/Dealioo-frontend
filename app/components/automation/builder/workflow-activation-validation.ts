import {
  expandBundledActions,
  isBundledActionsNode,
} from "@/app/components/automation/builder/bundled-actions";
import { isUserCreatedActionNode } from "@/app/components/automation/builder/action-node-defaults";
import { resolveWaitDelayMinutesFromConfig } from "@/app/components/automation/payment-reminder-schedule-validation";
import type { WorkflowNode } from "@/app/components/automation/types";

export type WorkflowActivationValidation =
  | { ok: true }
  | {
      ok: false;
      message: string;
      invalidNodeIds: string[];
      invalidStepIds: string[];
      firstInvalidNodeId: string | null;
    };

function validateEmailNode(node: WorkflowNode): boolean {
  const subject = String(node.config.subject ?? "").trim();
  const message = String(node.config.message ?? "").trim();
  return subject.length > 0 && message.length > 0;
}

function validateSmsNode(node: WorkflowNode): boolean {
  const message = String(node.config.message ?? "").trim();
  if (message.length > 0) {
    return true;
  }
  if (!isUserCreatedActionNode(node)) {
    const linkLabel = String(
      node.config.linkLabel ?? node.config.ctaLabel ?? "",
    ).trim();
    return linkLabel.length > 0;
  }
  return false;
}

function validateWaitNode(node: WorkflowNode): boolean {
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
      const value = String((row as Record<string, unknown>).value ?? "").trim();
      return value.length > 0;
    });
  }

  const conditionType = String(config.conditionType ?? "").trim();
  const value = String(config.value ?? config.conditionValue ?? "").trim();
  return conditionType.length > 0 || value.length > 0;
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

export function validateWorkflowForActivation(
  nodes: WorkflowNode[],
): WorkflowActivationValidation {
  const invalidNodeIds = new Set<string>();
  const invalidStepIds = new Set<string>();

  for (const node of nodes) {
    if (isBundledActionsNode(node)) {
      for (const step of expandBundledActions(node)) {
        if (!validateActionNode(step)) {
          invalidNodeIds.add(node.id);
          invalidStepIds.add(step.id);
        }
      }
      continue;
    }

    if (!validateWorkflowNode(node)) {
      invalidNodeIds.add(node.id);
      invalidStepIds.add(node.id);
    }
  }

  if (invalidNodeIds.size === 0) {
    return { ok: true };
  }

  const firstInvalidNode =
    nodes.find((node) => invalidNodeIds.has(node.id)) ?? null;
  const label = firstInvalidNode ? nodeLabel(firstInvalidNode) : "a step";

  return {
    ok: false,
    message: `Fill in all required settings to proceed. "${label}" still has empty fields.`,
    invalidNodeIds: [...invalidNodeIds],
    invalidStepIds: [...invalidStepIds],
    firstInvalidNodeId: firstInvalidNode?.id ?? null,
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
