import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";

export const PREPAID_PAYMENT_ACTIONS_KIND = "prepaid_payment_actions";

/** True when a tag node bundles SMS + email (or other steps) in one Actions card. */
export function isBundledActionsNode(node: WorkflowNode): boolean {
  if (node.kind !== "tag_customer") {
    return false;
  }
  const actions = node.config.actions;
  return Array.isArray(actions) && actions.length > 0;
}

function actionTypeToKind(type: unknown): WorkflowNodeKind {
  if (type === "send_email") {
    return "send_email";
  }
  if (type === "send_whatsapp") {
    return "send_whatsapp";
  }
  return "send_sms";
}

/** Expand bundled config into virtual steps for the Actions canvas card. */
export function expandBundledActions(node: WorkflowNode): WorkflowNode[] {
  const actions = node.config.actions;
  if (!Array.isArray(actions)) {
    return [node];
  }

  return actions.map((rawAction, index) => {
    const action =
      rawAction && typeof rawAction === "object"
        ? (rawAction as Record<string, unknown>)
        : {};
    const kind = actionTypeToKind(action.type);

    return {
      ...node,
      id: `${node.id}-bundled-${index}`,
      kind,
      label: kind === "send_email" ? "Send Email" : "Send Text",
      config: action,
    };
  });
}

/**
 * Canvas display for prepaid bundled actions — show bundled emails in the Actions card.
 */
export function expandBundledActionsForDisplay(node: WorkflowNode): WorkflowNode[] {
  if (!isBundledActionsNode(node)) {
    return [node];
  }

  const workflowKind = String(node.config.workflowKind ?? "").trim();
  if (workflowKind !== PREPAID_PAYMENT_ACTIONS_KIND) {
    return expandBundledActions(node);
  }

  return expandBundledActions(node).filter((step) => step.kind === "send_email");
}
