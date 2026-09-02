import type { WorkflowNode, WorkflowNodeKind } from "@/app/components/automation/types";
import {
  FLOW_BRANCH_PAYMENT_REMINDER,
  FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION,
  isParallelSplitNode,
} from "@/app/components/automation/builder/flow-layout";

export const PREPAID_PAYMENT_ACTIONS_KIND = "prepaid_payment_actions";
export const PREPAID_VISIT_REMINDER_LOOP_KIND = "prepaid_visit_reminder";
export const PREPAID_VISIT_REMINDER_WAIT_LOOP_KIND = "prepaid_visit_reminder_wait";
export const PAYMENT_REMINDER_EMAIL_KIND = "payment_reminder_email";
export const PAYMENT_REMINDER_WAIT_KIND = "payment_reminder_wait";
export const PAYMENT_REMINDER_WALLET_WAIT_KIND = "payment_reminder_wallet_wait";
export const PAYMENT_REMINDER_WALLET_EMAIL_KIND = "payment_reminder_wallet_email";
export const PAYMENT_REMINDER_EXPIRY_WAIT_KIND = "payment_reminder_expiry_wait";
export const PAYMENT_REMINDER_EXPIRY_EMAIL_KIND = "payment_reminder_expiry_email";

const WALLET_REMINDER_EMAIL_DEFAULTS = {
  subject: "Don't forget — add your coupon to Google Wallet",
  template: "QR pass guide",
  message:
    "Hi — we noticed you haven't added your coupon to Google Wallet yet.\n\nJust in case you were planning to stop by to redeem it, you'll need to add it to your wallet first.\n\nTap the button below to add your pass.",
  headline: "Add your coupon to Google Wallet",
  ctaLabel: "View my pass",
} as const;

const OFFER_EXPIRY_EMAIL_DEFAULTS = {
  subject: "Your offer is expiring soon",
  template: "Payment reminder",
  message:
    "Hi — just a friendly reminder that your offer is expiring soon.\n\nComplete your payment and save your pass so you don't miss out.\n\nTap the button below to finish checkout.",
  headline: "Your offer is expiring soon",
  ctaLabel: "Complete payment",
} as const;

export const PREPAID_FIRST_EMAIL_DEFAULTS = {
  subject: "Your prepaid offer is ready — visit us with your pass",
  template: "Payment confirmation",
  headline: "Your offer is ready for your visit",
  message:
    "Hi [First Name]! Your payment is confirmed and your prepaid offer is ready.\n\nWhen you're ready to visit, open your pass below and show it at the business. We look forward to welcoming you!",
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

export function isPrepaidFirstEmailNode(node: WorkflowNode): boolean {
  if (isPrepaidBundledActionsNode(node)) {
    return true;
  }
  return (
    node.kind === "send_email" &&
    String(node.config.workflowKind ?? "").trim() === PREPAID_PAYMENT_ACTIONS_KIND
  );
}

export function isPrepaidVisitReminderWaitLoopNode(node: WorkflowNode): boolean {
  return (
    node.kind === "wait" &&
    String(node.config.workflowKind ?? "").trim() ===
      PREPAID_VISIT_REMINDER_WAIT_LOOP_KIND
  );
}

export function resolvePrepaidFalseLoopTargetNode(
  flowNodes: WorkflowNode[],
): WorkflowNode | null {
  const visitFilter = flowNodes.find((node) => {
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
  });

  const loopKind = String(
    visitFilter?.config?.onFalseLoopWorkflowKind ??
      PREPAID_VISIT_REMINDER_WAIT_LOOP_KIND,
  ).trim();

  if (loopKind === PREPAID_VISIT_REMINDER_WAIT_LOOP_KIND) {
    return flowNodes.find(isPrepaidVisitReminderWaitLoopNode) ?? null;
  }

  if (loopKind === PREPAID_VISIT_REMINDER_LOOP_KIND) {
    return flowNodes.find(isPrepaidVisitReminderLoopNode) ?? null;
  }

  if (loopKind === PREPAID_PAYMENT_ACTIONS_KIND) {
    return flowNodes.find(isPrepaidFirstEmailNode) ?? null;
  }

  return (
    flowNodes.find(
      (node) => String(node.config?.workflowKind ?? "").trim() === loopKind,
    ) ?? flowNodes.find(isPrepaidVisitReminderWaitLoopNode) ?? null
  );
}

export function isPrepaidVisitReminderLoopNode(node: WorkflowNode): boolean {
  return (
    node.kind === "send_email" &&
    String(node.config.workflowKind ?? "").trim() ===
      PREPAID_VISIT_REMINDER_LOOP_KIND
  );
}

export function isPaymentReminderEmailNode(node: WorkflowNode): boolean {
  return (
    node.kind === "send_email" &&
    String(node.config.workflowKind ?? "").trim() === PAYMENT_REMINDER_EMAIL_KIND
  );
}

export function isPaymentReminderLoopFilterNode(node: WorkflowNode): boolean {
  if (node.kind !== "condition") {
    return false;
  }
  return (
    String(node.config.onFalseLoopWorkflowKind ?? "").trim() ===
    PAYMENT_REMINDER_EMAIL_KIND
  );
}

export function isPaymentReminderStatusSplitFilterNode(
  node: WorkflowNode,
): boolean {
  return (
    node.kind === "condition" &&
    node.config.isPaymentReminderStatusSplit === true
  );
}

export function isPaymentReminderFlow(nodes: WorkflowNode[]): boolean {
  return nodes.some(isPaymentReminderEmailNode);
}

export function resolvePaymentReminderLoopTargetNode(
  flowNodes: WorkflowNode[],
): WorkflowNode | null {
  const loopFilter = flowNodes.find(isPaymentReminderLoopFilterNode);
  if (!loopFilter) {
    return null;
  }
  const loopKind = String(
    loopFilter.config.onFalseLoopWorkflowKind ?? PAYMENT_REMINDER_EMAIL_KIND,
  ).trim();
  return (
    flowNodes.find(
      (node) => String(node.config?.workflowKind ?? "").trim() === loopKind,
    ) ?? flowNodes.find(isPaymentReminderEmailNode) ?? null
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

function stripPaymentReminderBranchMeta(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...config };
  delete next.flowBranch;
  delete next.flowSectionTitle;
  delete next.flowBranchParent;
  delete next.isPaymentReminderStatusSplit;
  delete next.branchLabelTrue;
  delete next.branchLabelFalse;
  return next;
}

function isWalletReminderEmailNode(node: WorkflowNode): boolean {
  if (node.kind !== "send_email") {
    return false;
  }
  if (
    String(node.config.workflowKind ?? "").trim() ===
    PAYMENT_REMINDER_WALLET_EMAIL_KIND
  ) {
    return true;
  }
  const message = String(node.config.message ?? "").toLowerCase();
  const headline = String(node.config.headline ?? "").toLowerCase();
  const subject = String(node.config.subject ?? "").toLowerCase();
  return (
    message.includes("haven't added your coupon") ||
    message.includes("havent added your coupon") ||
    headline.includes("add your coupon to google wallet") ||
    subject.includes("add your coupon to google wallet")
  );
}

function isExpiryReminderEmailNode(node: WorkflowNode): boolean {
  if (node.kind !== "send_email") {
    return false;
  }
  if (
    String(node.config.workflowKind ?? "").trim() ===
    PAYMENT_REMINDER_EXPIRY_EMAIL_KIND
  ) {
    return true;
  }
  const message = String(node.config.message ?? "").toLowerCase();
  const headline = String(node.config.headline ?? "").toLowerCase();
  const subject = String(node.config.subject ?? "").toLowerCase();
  return (
    message.includes("expiring soon") ||
    headline.includes("expiring soon") ||
    subject.includes("expiring soon")
  );
}

function isOfferExpiryFilterNode(node: WorkflowNode): boolean {
  if (node.kind !== "condition") {
    return false;
  }
  const conditionType = String(node.config.conditionType ?? "").toLowerCase();
  const raw = JSON.stringify(node.config.conditions ?? node.config.value ?? "");
  return (
    conditionType.includes("offer expires") ||
    /offer expires in less than/i.test(raw)
  );
}

function isQrPassEmailNode(node: WorkflowNode): boolean {
  if (
    node.kind !== "send_email" ||
    isWalletReminderEmailNode(node) ||
    isExpiryReminderEmailNode(node)
  ) {
    return false;
  }
  const template = String(node.config.template ?? "").toLowerCase();
  const subject = String(node.config.subject ?? "").toLowerCase();
  const headline = String(node.config.headline ?? "").toLowerCase();
  return (
    template.includes("qr pass") ||
    subject.includes("qr pass") ||
    headline.includes("qr pass is ready")
  );
}

function isPassNotAddedFilterNode(node: WorkflowNode): boolean {
  if (node.kind !== "condition") {
    return false;
  }
  const conditionType = String(node.config.conditionType ?? "").toLowerCase();
  const raw = JSON.stringify(node.config.conditions ?? node.config.value ?? "");
  return (
    conditionType.includes("pass not added") ||
    /pass was added/i.test(raw) ||
    /not pass was added/i.test(raw)
  );
}

function isUnpaidFilterNode(node: WorkflowNode): boolean {
  if (node.kind !== "condition" || isPassNotAddedFilterNode(node)) {
    return false;
  }
  const conditionType = String(node.config.conditionType ?? "").toLowerCase();
  const raw = JSON.stringify(node.config.conditions ?? node.config.value ?? "");
  return (
    conditionType.includes("not completed payment") ||
    /status not paid/i.test(raw) ||
    /has not completed payment/i.test(raw)
  );
}

function makeSyntheticNode(
  id: string,
  kind: WorkflowNode["kind"],
  label: string,
  config: Record<string, unknown>,
): WorkflowNode {
  return {
    id,
    kind,
    label,
    config,
  };
}

function isSavedPaymentReminderTemplateGraph(nodes: WorkflowNode[]): boolean {
  return nodes.some((node) => {
    const workflowKind = String(node.config.workflowKind ?? "").trim();
    if (workflowKind) {
      return (
        workflowKind.startsWith("payment_reminder") ||
        workflowKind === PAYMENT_REMINDER_EMAIL_KIND ||
        workflowKind === PAYMENT_REMINDER_WALLET_EMAIL_KIND ||
        workflowKind === PAYMENT_REMINDER_EXPIRY_EMAIL_KIND ||
        workflowKind === PAYMENT_REMINDER_WALLET_WAIT_KIND ||
        workflowKind === PAYMENT_REMINDER_EXPIRY_WAIT_KIND
      );
    }

    return (
      isPaymentReminderEmailNode(node) ||
      isPaymentReminderLoopFilterNode(node) ||
      isPaymentReminderStatusSplitFilterNode(node) ||
      isPassNotAddedFilterNode(node) ||
      isWalletReminderEmailNode(node) ||
      Boolean(node.config.flowBranch) ||
      node.config.isPaymentReminderStatusSplit === true
    );
  });
}

export function normalizePaymentReminderWorkflowNodes(
  nodes: WorkflowNode[],
  purpose?: string | null,
): WorkflowNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  if (purpose !== "funnel_signup_payment_reminder") {
    return nodes;
  }

  const isScratchGraph = nodes.some(
    (node) =>
      (node.kind === "cron_trigger" ||
        node.kind === "signup_trigger" ||
        node.kind === "payment_trigger" ||
        node.kind === "funnel_complete") &&
      (node.config?.executionMode === "graph" ||
        node.config?.isCustomGraph === true),
  );
  if (isScratchGraph) {
    return nodes;
  }

  if (!isSavedPaymentReminderTemplateGraph(nodes)) {
    return nodes;
  }

  const qrFromAnyBranch =
    nodes.find(isQrPassEmailNode) ??
    nodes.find(
      (node) =>
        node.kind === "send_email" &&
        !isWalletReminderEmailNode(node) &&
        String(node.config.ctaLabel ?? "")
          .toLowerCase()
          .includes("view my pass"),
    ) ??
    null;

  const walletFromAnyBranch =
    nodes.find(isWalletReminderEmailNode) ?? null;

  const withoutEscalation = nodes.filter((node) => {
    if (isParallelSplitNode(node)) {
      return false;
    }
    const branch = String(node.config.flowBranch ?? "").trim();
    if (branch === FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION) {
      if (
        (qrFromAnyBranch && node.id === qrFromAnyBranch.id) ||
        (walletFromAnyBranch && node.id === walletFromAnyBranch.id) ||
        isPassNotAddedFilterNode(node)
      ) {
        return true;
      }
      return false;
    }
    return true;
  });

  const cleaned = withoutEscalation.map((node) => {
    const branch = String(node.config.flowBranch ?? "").trim();
    const shouldStrip =
      branch === FLOW_BRANCH_PAYMENT_REMINDER ||
      branch === FLOW_BRANCH_PAYMENT_REMINDER_ESCALATION ||
      node.config.isPaymentReminderStatusSplit === true ||
      Boolean(node.config.flowSectionTitle);
    if (!shouldStrip) {
      return node;
    }
    return {
      ...node,
      config: stripPaymentReminderBranchMeta(node.config),
    };
  });

  const trigger = cleaned.find((node) => node.kind === "cron_trigger");
  const paymentEmail =
    cleaned.find(isPaymentReminderEmailNode) ??
    cleaned.find(
      (node) =>
        node.kind === "send_email" &&
        !isQrPassEmailNode(node) &&
        !isWalletReminderEmailNode(node) &&
        String(node.config.ctaLabel ?? "")
          .toLowerCase()
          .includes("complete payment"),
    ) ??
    cleaned.find(
      (node) =>
        node.kind === "send_email" &&
        !isQrPassEmailNode(node) &&
        !isWalletReminderEmailNode(node),
    );
  const waitNode =
    cleaned.find(
      (node) =>
        (node.kind === "wait" || node.kind === "delay") &&
        String(node.config.workflowKind ?? "").trim() === PAYMENT_REMINDER_WAIT_KIND,
    ) ??
    cleaned.find(
      (node) =>
        (node.kind === "wait" || node.kind === "delay") &&
        String(node.config.workflowKind ?? "").trim() !==
          PAYMENT_REMINDER_WALLET_WAIT_KIND,
    );
  const waitBeforeWalletNode =
    cleaned.find(
      (node) =>
        (node.kind === "wait" || node.kind === "delay") &&
        String(node.config.workflowKind ?? "").trim() ===
          PAYMENT_REMINDER_WALLET_WAIT_KIND,
    ) ??
    cleaned.find(
      (node) =>
        (node.kind === "wait" || node.kind === "delay") &&
        waitNode != null &&
        node.id !== waitNode.id,
    ) ??
    makeSyntheticNode(
      "payment-reminder-wallet-wait",
      "wait",
      "Wait until",
      {
        delay: 2,
        unit: "minutes",
        workflowKind: PAYMENT_REMINDER_WALLET_WAIT_KIND,
      },
    );
  const qrEmail =
    cleaned.find(isQrPassEmailNode) ??
    (qrFromAnyBranch
      ? {
          ...qrFromAnyBranch,
          config: stripPaymentReminderBranchMeta(qrFromAnyBranch.config),
        }
      : null);

  const walletEmail =
    cleaned.find(isWalletReminderEmailNode) ??
    (walletFromAnyBranch
      ? {
          ...walletFromAnyBranch,
          config: stripPaymentReminderBranchMeta(walletFromAnyBranch.config),
        }
      : null) ??
    makeSyntheticNode(
      "payment-reminder-wallet-email",
      "send_email",
      "Send Email",
      {
        ...WALLET_REMINDER_EMAIL_DEFAULTS,
        workflowKind: PAYMENT_REMINDER_WALLET_EMAIL_KIND,
      },
    );

  const unpaidFilters = cleaned.filter(isUnpaidFilterNode);
  const mainFilter = unpaidFilters[0]
    ? {
        ...unpaidFilters[0],
        config: {
          ...stripPaymentReminderBranchMeta(unpaidFilters[0].config),
          conditionType: "Has not completed payment",
          conditions: [{ negated: true, value: "Status not paid" }],
        },
      }
    : null;

  const passFilter =
    cleaned.find(isPassNotAddedFilterNode) ??
    makeSyntheticNode(
      "payment-reminder-pass-filter",
      "condition",
      "Filters",
      {
        conditionType: "Pass not added",
        conditions: [{ negated: true, value: "Pass was added" }],
      },
    );

  const ordered: WorkflowNode[] = [];
  if (trigger) ordered.push(trigger);
  if (mainFilter) ordered.push(mainFilter);
  if (paymentEmail) {
    ordered.push({
      ...paymentEmail,
      config: {
        ...stripPaymentReminderBranchMeta(paymentEmail.config),
        workflowKind: PAYMENT_REMINDER_EMAIL_KIND,
      },
    });
  }
  if (waitNode) {
    ordered.push({
      ...waitNode,
      config: {
        ...stripPaymentReminderBranchMeta(waitNode.config),
        workflowKind: PAYMENT_REMINDER_WAIT_KIND,
      },
    });
  }
  if (qrEmail) {
    ordered.push({
      ...qrEmail,
      config: stripPaymentReminderBranchMeta(qrEmail.config),
    });
  }
  ordered.push({
    ...waitBeforeWalletNode,
    config: {
      ...stripPaymentReminderBranchMeta(waitBeforeWalletNode.config),
      delay: Number(waitBeforeWalletNode.config.delay ?? 2) || 2,
      unit: String(waitBeforeWalletNode.config.unit ?? "minutes"),
      workflowKind: PAYMENT_REMINDER_WALLET_WAIT_KIND,
    },
  });
  ordered.push({
    ...passFilter,
    config: {
      ...stripPaymentReminderBranchMeta(passFilter.config),
      conditionType: "Pass not added",
      conditions: [{ negated: true, value: "Pass was added" }],
    },
  });
  ordered.push({
    ...walletEmail,
    config: {
      ...stripPaymentReminderBranchMeta(walletEmail.config),
      workflowKind: PAYMENT_REMINDER_WALLET_EMAIL_KIND,
    },
  });

  const waitBeforeExpiryNode =
    cleaned.find(
      (node) =>
        (node.kind === "wait" || node.kind === "delay") &&
        String(node.config.workflowKind ?? "").trim() ===
          PAYMENT_REMINDER_EXPIRY_WAIT_KIND,
    ) ??
    cleaned.find(
      (node) =>
        (node.kind === "wait" || node.kind === "delay") &&
        waitNode != null &&
        waitBeforeWalletNode != null &&
        node.id !== waitNode.id &&
        node.id !== waitBeforeWalletNode.id,
    ) ??
    makeSyntheticNode(
      "payment-reminder-expiry-wait",
      "wait",
      "Wait until",
      {
        delay: 2,
        unit: "minutes",
        workflowKind: PAYMENT_REMINDER_EXPIRY_WAIT_KIND,
      },
    );

  const expiryFilter =
    cleaned.find(isOfferExpiryFilterNode) ??
    makeSyntheticNode(
      "payment-reminder-expiry-filter",
      "condition",
      "Filters",
      {
        conditionType: "Offer expires soon",
        conditions: [
          {
            value: "Offer expires in less than 3 days",
            amount: 3,
            unit: "days",
          },
        ],
      },
    );

  const expiryEmail =
    cleaned.find(isExpiryReminderEmailNode) ??
    makeSyntheticNode(
      "payment-reminder-expiry-email",
      "send_email",
      "Send Email",
      {
        ...OFFER_EXPIRY_EMAIL_DEFAULTS,
        workflowKind: PAYMENT_REMINDER_EXPIRY_EMAIL_KIND,
      },
    );

  const expiryCondition =
    Array.isArray(expiryFilter.config.conditions) &&
    expiryFilter.config.conditions[0] &&
    typeof expiryFilter.config.conditions[0] === "object"
      ? (expiryFilter.config.conditions[0] as Record<string, unknown>)
      : {};
  const expiryAmount = Math.max(1, Number(expiryCondition.amount ?? 3) || 3);
  const expiryUnit = String(expiryCondition.unit ?? "days") || "days";

  ordered.push({
    ...waitBeforeExpiryNode,
    config: {
      ...stripPaymentReminderBranchMeta(waitBeforeExpiryNode.config),
      delay: Number(waitBeforeExpiryNode.config.delay ?? 2) || 2,
      unit: String(waitBeforeExpiryNode.config.unit ?? "minutes"),
      workflowKind: PAYMENT_REMINDER_EXPIRY_WAIT_KIND,
    },
  });
  ordered.push({
    ...expiryFilter,
    config: {
      ...stripPaymentReminderBranchMeta(expiryFilter.config),
      conditionType: "Offer expires soon",
      conditions: [
        {
          value: `Offer expires in less than ${expiryAmount} ${expiryUnit}`,
          amount: expiryAmount,
          unit: expiryUnit,
        },
      ],
    },
  });
  ordered.push({
    ...expiryEmail,
    config: {
      ...stripPaymentReminderBranchMeta(expiryEmail.config),
      workflowKind: PAYMENT_REMINDER_EXPIRY_EMAIL_KIND,
    },
  });

  return ordered.length > 0 ? ordered : nodes;
}
