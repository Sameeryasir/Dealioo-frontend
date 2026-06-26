import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";

export const PREPAID_PAYMENT_ACTIONS_KIND = "prepaid_payment_actions";

export const PREPAID_FIRST_EMAIL_DEFAULTS = {
  subject: "Your prepaid offer is ready — visit us with your pass",
  template: "Payment confirmation",
  headline: "Your offer is ready for your visit",
  message:
    "Hi [First Name]! Your payment is confirmed and your prepaid offer is ready.\n\nWhen you're ready to visit, open your pass below and show it at the restaurant. We look forward to welcoming you!",
  ctaLabel: "View my pass",
} as const;

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

export function isPrepaidBundledActionsNode(node: WorkflowNode): boolean {
  if (node.kind !== "tag_customer") {
    return false;
  }
  return (
    String(node.config.workflowKind ?? "").trim() === PREPAID_PAYMENT_ACTIONS_KIND
  );
}

/** First prepaid email step — regular Send Email or legacy bundled Actions node. */
export function isPrepaidFirstEmailNode(node: WorkflowNode): boolean {
  if (isPrepaidBundledActionsNode(node)) {
    return true;
  }
  return (
    node.kind === "send_email" &&
    String(node.config.workflowKind ?? "").trim() === PREPAID_PAYMENT_ACTIONS_KIND
  );
}

export function findPrepaidBundledEmailActionIndex(node: WorkflowNode): number {
  const actions = node.config.actions;
  if (!Array.isArray(actions)) {
    return -1;
  }
  return actions.findIndex(
    (action) =>
      action &&
      typeof action === "object" &&
      String((action as Record<string, unknown>).type ?? "").trim() ===
        "send_email",
  );
}

export function mergePrepaidBundledEmailAction(
  node: WorkflowNode,
  updates: {
    subject: string;
    message: string;
    ctaLabel: string;
    template: string;
  },
): Record<string, unknown> {
  const actions = Array.isArray(node.config.actions)
    ? [...node.config.actions]
    : [];
  const index = findPrepaidBundledEmailActionIndex(node);
  if (index < 0) {
    return node.config;
  }

  const current = actions[index] as Record<string, unknown>;
  actions[index] = {
    ...current,
    type: "send_email",
    subject: updates.subject,
    message: updates.message,
    template: updates.template,
    ...(updates.ctaLabel ? { ctaLabel: updates.ctaLabel } : {}),
  };

  return {
    ...node.config,
    workflowKind: PREPAID_PAYMENT_ACTIONS_KIND,
    actions,
  };
}
