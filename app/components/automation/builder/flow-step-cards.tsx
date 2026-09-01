"use client";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CalendarClock,
  Clock,
  CreditCard,
  Filter,
  Gift,
  GitBranch,
  MessageSquare,
  RotateCcw,
  Send,
  UserPlus,
} from "lucide-react";
import {
  DEALIOO_SIDEBAR,
  FLOW_ACTIONS,
  FLOW_FILTER,
  FLOW_TRIGGER,
  FLOW_WAIT,
} from "@/app/components/automation/builder/flow-step-colors";
import { formatCronScheduleSummary } from "@/app/components/automation/builder/cron-schedule-display";
import {
  formatExpirationDisplay,
  formatWaitSummary,
  getFilterConditions,
  getExpirationNote,
  getRewardName,
  getReturnOfferEmailPreview,
  getSmsLinkLabel,
  getSmsMessage,
  getTriggerDescription,
  getTriggerTitle,
  isReturnOfferEmailNode,
  isSmsMergeTag,
  splitSmsPreviewParts,
} from "@/app/components/automation/builder/workflow-node-display";
import {
  expandBundledActionsForDisplay, isBundledActionsNode, isPaymentReminderLoopFilterNode, isPaymentReminderStatusSplitFilterNode, isPrepaidVisitReminderLoopNode, PREPAID_FIRST_EMAIL_DEFAULTS } from "@/app/components/automation/builder/bundled-actions";
import { getEmailPreviewText } from "@/app/components/automation/builder/action-node-defaults";
import { isCustomerVisitedFilterNode, isParallelSplitNode } from "@/app/components/automation/builder/flow-layout";
import { isActionNodeKind, isTriggerNodeKind } from "@/app/components/automation/automation-ui";
import type { WorkflowNode } from "@/app/components/automation/types";

const FLOW_STEP_INVALID_BLINK = "automation-flow-step-invalid-blink";

function hasInvalidStepIds(
  invalidStepIds: ReadonlySet<string> | readonly string[] | undefined,
): boolean {
  if (!invalidStepIds) {
    return false;
  }
  if (Array.isArray(invalidStepIds)) {
    return invalidStepIds.length > 0;
  }
  return [...invalidStepIds].length > 0;
}

function cardShellClass(
  selected: boolean,
  ringClass: string,
  invalid = false,
): string {
  const base = selected
    ? `ring-2 ring-offset-2 ring-offset-[#ececee] ${ringClass} shadow-lg`
    : "shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]";

  return invalid ? `${base} ${FLOW_STEP_INVALID_BLINK}` : base;
}

export function FlowStepHeader({
  icon: Icon,
  title,
  subtitle,
  iconClass,
  barClass,
  subtitleClass = "opacity-80",
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  iconClass: string;
  barClass: string;
  subtitleClass?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 border-b px-5 py-4 ${barClass}`}>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${iconClass}`}
      >
        <Icon className="size-4 text-white" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-tight">{title}</p>
        {subtitle ? (
          <p className={`text-[0.625rem] ${subtitleClass}`}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function triggerIcon(node: WorkflowNode): LucideIcon {
  switch (node.kind) {
    case "cron_trigger":
      return CalendarClock;
    case "payment_trigger":
      return CreditCard;
    default:
      return UserPlus;
  }
}

function triggerDisplayTitle(node: WorkflowNode): string {
  switch (node.kind) {
    case "cron_trigger":
      return "Cron Job";
    case "payment_trigger":
      return "Payment Trigger";
    case "signup_trigger":
      return "Signup";
    case "funnel_complete":
      return "Funnel Complete";
    default:
      return getTriggerTitle(node);
  }
}

function triggerDisplayBody(node: WorkflowNode): string {
  if (node.kind === "cron_trigger") {
    const schedule = formatCronScheduleSummary(node.config);
    return `${schedule}. Checks unpaid guests, then continues the flow.`;
  }
  return getTriggerDescription(node);
}

export function FlowTriggerCard({
  node,
  selected,
  pressing = false,
  invalid = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
  invalid?: boolean;
}) {
  const Icon = triggerIcon(node);
  const shellClass = invalid
    ? cardShellClass(!!selected, FLOW_TRIGGER.ring, true)
    : selected
      ? cardShellClass(true, FLOW_TRIGGER.ring)
      : pressing
        ? "scale-[0.99]"
        : "";

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${FLOW_TRIGGER.border} bg-white transition-all ${shellClass}`}
    >
      <div className="relative">
        <div
          className={`pointer-events-none absolute inset-0 ${DEALIOO_SIDEBAR.glow}`}
          aria-hidden
        />
        <FlowStepHeader
          icon={Icon}
          title={triggerDisplayTitle(node)}
          subtitle="When this automation starts"
          iconClass={FLOW_TRIGGER.icon}
          barClass={`relative z-[1] ${FLOW_TRIGGER.header}`}
          subtitleClass={FLOW_TRIGGER.headerSub}
        />
      </div>
      <div className="bg-white px-5 py-5 sm:px-6 sm:py-6">
        <p className={`text-sm font-medium leading-relaxed ${FLOW_TRIGGER.body}`}>
          {triggerDisplayBody(node)}
        </p>
      </div>
    </div>
  );
}

export function FlowWaitCard({
  node,
  selected,
  pressing = false,
  invalid = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
  invalid?: boolean;
}) {
  const shellClass = invalid
    ? cardShellClass(!!selected, FLOW_WAIT.ring, true)
    : selected
      ? cardShellClass(true, FLOW_WAIT.ring)
      : pressing
        ? "scale-[0.99]"
        : "";

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${FLOW_WAIT.border} bg-white transition-all ${shellClass}`}
    >
      <FlowStepHeader
        icon={Clock}
        title="Wait until"
        subtitle="Delay before the next step"
        iconClass={FLOW_WAIT.icon}
        barClass={FLOW_WAIT.header}
        subtitleClass={FLOW_WAIT.headerSub}
      />
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className={`text-sm font-bold tracking-tight ${FLOW_WAIT.body}`}>
          {formatWaitSummary(node.config)}
        </p>
      </div>
    </div>
  );
}

export function FlowFilterCard({
  node,
  selected,
  pressing = false,
  invalid = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
  invalid?: boolean;
}) {
  const conditions = getFilterConditions(node);
  const shellClass = invalid
    ? cardShellClass(!!selected, FLOW_FILTER.ring, true)
    : selected
      ? cardShellClass(true, FLOW_FILTER.ring)
      : pressing
        ? "scale-[0.99]"
        : "";

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${FLOW_FILTER.border} bg-white transition-all ${shellClass}`}
    >
      <FlowStepHeader
        icon={Filter}
        title="Filters"
        subtitle="Only continue when this matches"
        iconClass={FLOW_FILTER.icon}
        barClass={FLOW_FILTER.header}
        subtitleClass={FLOW_FILTER.headerSub}
      />
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-5 sm:px-6 sm:py-6">
        {conditions.map((condition, index) => (
          <span key={`${condition.label}-${index}`} className="contents">
            {index > 0 ? (
              <span className="text-[0.65rem] font-semibold lowercase text-zinc-500">and</span>
            ) : null}
            {condition.negated ? (
              <span
                className={`rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide shadow-sm ${FLOW_FILTER.notPill}`}
              >
                NOT
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${FLOW_FILTER.valuePill}`}
            >
              {condition.label}
            </span>
          </span>
        ))}
      </div>
      {isCustomerVisitedFilterNode(node) ? (
        <div className="grid gap-2 border-t border-zinc-100 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 px-3 py-2.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-800">
              If not visited
            </p>
            <p className="mt-1 text-[0.65rem] font-medium text-blue-950">
              {String(node.config.branchLabelFalse ?? "Restart from first email")}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-800">
              If visited
            </p>
            <p className="mt-1 text-[0.65rem] font-medium text-blue-950">
              {String(node.config.branchLabelTrue ?? "Continue post-visit emails")}
            </p>
          </div>
        </div>
      ) : isPaymentReminderLoopFilterNode(node) ? (
        <div className="grid gap-2 border-t border-zinc-100 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 px-3 py-2.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-800">
              Still unpaid
            </p>
            <p className="mt-1 text-[0.65rem] font-medium text-blue-950">
              {String(
                node.config.branchLabelFalse ??
                  "Send payment + pass reminders again",
              )}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-800">
              Guest paid
            </p>
            <p className="mt-1 text-[0.65rem] font-medium text-blue-950">
              {String(node.config.branchLabelTrue ?? "Stop reminders")}
            </p>
          </div>
        </div>
      ) : isPaymentReminderStatusSplitFilterNode(node) ? (
        <div className="grid gap-2 border-t border-zinc-100 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-2.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-800">
              If paid → left branch
            </p>
            <p className="mt-1 text-[0.65rem] font-medium text-blue-950">
              {String(
                node.config.branchLabelTrue ?? "Guest paid — stop reminders",
              )}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 px-3 py-2.5">
            <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-800">
              If unpaid → right branch
            </p>
            <p className="mt-1 text-[0.65rem] font-medium text-blue-950">
              {String(
                node.config.branchLabelFalse ??
                  "Still unpaid — send reminders",
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PrepaidLoopBackCard({
  loopTarget,
  flowNodes = [],
}: {
  loopTarget: WorkflowNode | null;
  flowNodes?: WorkflowNode[];
}) {
  const displayNode =
    loopTarget?.kind === "wait" || loopTarget?.kind === "delay"
      ? flowNodes.find(isPrepaidVisitReminderLoopNode) ?? loopTarget
      : loopTarget;

  const previewSubject = String(displayNode?.config?.subject ?? "").trim();
  const previewMessage =
    displayNode?.config?.actions &&
    Array.isArray(displayNode.config.actions) &&
    typeof displayNode.config.actions[0] === "object" &&
    displayNode.config.actions[0] != null
      ? String(
          (displayNode.config.actions[0] as Record<string, unknown>).message ??
            "",
        ).trim()
      : String(displayNode?.config?.message ?? "").trim() ||
        PREPAID_FIRST_EMAIL_DEFAULTS.message;

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50/80 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <RotateCcw className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold tracking-tight text-zinc-900">
            Loop back
          </p>
          <p className="text-[0.65rem] font-medium text-blue-800">
            Customer not visited → send visit reminder again
          </p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-700">
          Send Email
        </p>
        {previewSubject ? (
          <p className="mt-1 text-[0.65rem] font-semibold text-zinc-800">
            {previewSubject}
          </p>
        ) : null}
        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-700">
          {previewMessage || "Visit reminder — your offer is ready"}
        </p>
      </div>
    </div>
  );
}

export function PaymentReminderLoopBackCard({
  loopTarget,
}: {
  loopTarget: WorkflowNode | null;
}) {
  const previewSubject = String(loopTarget?.config?.subject ?? "").trim();
  const previewMessage = String(loopTarget?.config?.message ?? "").trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50/80 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <RotateCcw className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold tracking-tight text-zinc-900">
            Loop back
          </p>
          <p className="text-[0.65rem] font-medium text-blue-800">
            Still unpaid → restart payment reminder cycle
          </p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-[0.6rem] font-bold uppercase tracking-wide text-blue-700">
          Send Email
        </p>
        {previewSubject ? (
          <p className="mt-1 text-[0.65rem] font-semibold text-zinc-800">
            {previewSubject}
          </p>
        ) : null}
        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-700">
          {previewMessage || "Complete your payment — your offer is waiting"}
        </p>
      </div>
    </div>
  );
}

export function PaymentReminderPaidStopCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50/80 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <GitBranch className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold tracking-tight text-zinc-900">
            Guest paid
          </p>
          <p className="text-[0.65rem] font-medium text-blue-800">
            Stop reminders for this guest
          </p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs leading-relaxed text-zinc-700">
          When payment is completed, this guest exits the payment reminder cycle.
        </p>
      </div>
    </div>
  );
}

function actionMeta(node: WorkflowNode): { label: string; icon: LucideIcon } {
  switch (node.kind) {
    case "send_email":
      return { label: "Send Email", icon: MessageSquare };
    case "send_sms":
    case "send_whatsapp":
      return { label: "Send Text", icon: MessageSquare };
    case "create_coupon":
      if (isReturnOfferEmailNode(node)) {
        return { label: "Send Email", icon: MessageSquare };
      }
      return { label: "Give Rewards", icon: Gift };
    case "tag_customer":
      return {
        label: node.label.trim() || "Set Reward Expiration",
        icon: CalendarClock,
      };
    default:
      return { label: node.label, icon: Send };
  }
}

function FlowActionStepBody({ node }: { node: WorkflowNode }) {
  const config = node.config;
  const linkLabel = getSmsLinkLabel(config);

  if (
    node.kind === "send_sms" ||
    node.kind === "send_whatsapp" ||
    isReturnOfferEmailNode(node)
  ) {
    const previewMessage = isReturnOfferEmailNode(node)
      ? getReturnOfferEmailPreview(config)
      : getSmsMessage(config);
    const parts = splitSmsPreviewParts(previewMessage);
    return (
      <div className="space-y-2.5 text-left">
        <p className="whitespace-pre-wrap text-left text-xs leading-relaxed text-zinc-700">
          {parts.map((part, index) =>
            isSmsMergeTag(part) ? (
              <span
                key={`${part}-${index}`}
                className="mx-0.5 inline rounded-md bg-blue-100 px-1.5 py-0.5 font-semibold text-blue-800"
              >
                {part}
              </span>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            ),
          )}
        </p>
        {linkLabel ? (
          <span className="inline-flex items-center rounded-lg bg-[#1877f2] px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm">
            {linkLabel}
          </span>
        ) : null}
      </div>
    );
  }

  if (node.kind === "send_email") {
    const previewMessage = getEmailPreviewText(config);
    if (!previewMessage) {
      return null;
    }

    const parts = splitSmsPreviewParts(previewMessage);
    return (
      <div className="space-y-2.5 text-left">
        <p className="whitespace-pre-wrap text-left text-xs leading-relaxed text-zinc-700">
          {parts.map((part, index) =>
            isSmsMergeTag(part) ? (
              <span
                key={`${part}-${index}`}
                className="mx-0.5 inline rounded-md bg-blue-100 px-1.5 py-0.5 font-semibold text-blue-800"
              >
                {part}
              </span>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            ),
          )}
        </p>
        {linkLabel ? (
          <span className="inline-flex items-center rounded-lg bg-[#1877f2] px-2.5 py-1 text-[0.65rem] font-semibold text-white shadow-sm">
            {linkLabel}
          </span>
        ) : null}
      </div>
    );
  }

  if (node.kind === "create_coupon") {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-zinc-900">
          Offer:{" "}
          <span className="font-bold text-zinc-950">{getRewardName(config)}</span>
        </p>
        <p className="text-[0.65rem] leading-relaxed text-zinc-500">
          Expires: {formatExpirationDisplay(config)}
        </p>
      </div>
    );
  }

  if (node.kind === "tag_customer") {
    const note = getExpirationNote(config).trim();
    if (/^extend offer/i.test(note)) {
      return (
        <p className="text-xs leading-relaxed text-zinc-700">{note}</p>
      );
    }
    return (
      <p className="text-xs leading-relaxed text-zinc-700">
        Set expiration for{" "}
        <span className="font-semibold text-zinc-900">{getRewardName(config)}</span> to{" "}
        <span className="font-semibold text-zinc-900">
          {formatExpirationDisplay(config)}
        </span>
      </p>
    );
  }

  return null;
}

export function FlowActionStepContent({
  node,
  selected,
  invalid = false,
  onSelect,
}: {
  node: WorkflowNode;
  selected?: boolean;
  invalid?: boolean;
  onSelect?: (id: string) => void;
}) {
  const { label, icon: Icon } = actionMeta(node);
  const selectStep = () => onSelect?.(node.id);
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={(e) => {
        if (!onSelect) return;
        e.stopPropagation();
        selectStep();
      }}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          selectStep();
        }
      }}
      className={`rounded-xl border transition-all ${
        onSelect ? "cursor-pointer" : ""
      } ${
        selected ? FLOW_ACTIONS.stepSelected : FLOW_ACTIONS.stepDefault
      } ${invalid ? FLOW_STEP_INVALID_BLINK : ""}`}
    >
      <div className="flex items-start gap-3.5 px-4 py-4 sm:px-5 sm:py-5">
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${FLOW_ACTIONS.stepIcon}`}
        >
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-blue-700/70">
            {label}
          </p>
          <div className="mt-2">
            <FlowActionStepBody node={node} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlowActionsBlockHeader() {
  return (
    <div className={`flex items-center gap-2.5 border-b px-5 py-4 ${FLOW_ACTIONS.header}`}>
      <span
        className={`flex size-8 items-center justify-center rounded-lg text-white shadow-sm ${FLOW_ACTIONS.icon}`}
      >
        <Send className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div>
        <p className="text-xs font-bold tracking-tight">Actions</p>
        <p className={`text-[0.625rem] ${FLOW_ACTIONS.headerSub}`}>
          Messages and rewards sent in order
        </p>
      </div>
    </div>
  );
}

export function FlowActionsGroupBody({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-4 bg-white px-4 py-4 sm:px-5 sm:py-5">
      {children}
      {footer ? (
        <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[0.625rem] text-zinc-400">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function FlowActionsBlock({
  nodes,
  selectedId,
  ownerNodeId,
  footer,
  invalidStepIds,
  onSelectStep,
}: {
  nodes: WorkflowNode[];
  selectedId?: string | null;
  ownerNodeId?: string;
  footer?: ReactNode;
  invalidStepIds?: ReadonlySet<string> | readonly string[];
  onSelectStep?: (id: string) => void;
}) {
  const invalidSteps =
    invalidStepIds instanceof Set
      ? invalidStepIds
      : new Set(invalidStepIds ?? []);
  const groupSelected =
    (ownerNodeId != null && selectedId === ownerNodeId) ||
    nodes.some((node) => node.id === selectedId);

  const handleSelectStep = onSelectStep
    ? (id: string) => {
        if (ownerNodeId != null && id.includes("-bundled-")) {
          onSelectStep(ownerNodeId);
          return;
        }
        onSelectStep(id);
      }
    : undefined;

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all ${
        groupSelected
          ? `border-blue-300 ring-2 ${FLOW_ACTIONS.ring}`
          : FLOW_ACTIONS.border
      }`}
    >
      <FlowActionsBlockHeader />
      <FlowActionsGroupBody footer={footer}>
        {nodes.map((node) => (
          <FlowActionStepContent
            key={node.id}
            node={node}
            invalid={invalidSteps.has(node.id)}
            selected={
              selectedId === node.id ||
              (ownerNodeId != null &&
                selectedId === ownerNodeId &&
                node.id.includes("-bundled-"))
            }
            onSelect={handleSelectStep}
          />
        ))}
      </FlowActionsGroupBody>
    </div>
  );
}

export function FlowStepCard({
  node,
  selected,
  pressing = false,
  invalid = false,
  invalidStepIds,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
  invalid?: boolean;
  invalidStepIds?: ReadonlySet<string> | readonly string[];
}) {
  if (isBundledActionsNode(node)) {
    return (
      <FlowActionsBlock
        nodes={expandBundledActionsForDisplay(node)}
        selectedId={selected ? node.id : null}
        ownerNodeId={node.id}
        invalidStepIds={invalidStepIds}
      />
    );
  }

  if (isActionNodeKind(node.kind)) {
    return (
      <FlowActionsBlock
        nodes={[node]}
        selectedId={selected ? node.id : null}
        invalidStepIds={
          invalid
            ? hasInvalidStepIds(invalidStepIds)
              ? invalidStepIds
              : [node.id]
            : invalidStepIds
        }
      />
    );
  }

  if (isTriggerNodeKind(node.kind)) {
    return (
      <FlowTriggerCard
        node={node}
        selected={selected}
        pressing={pressing}
        invalid={invalid}
      />
    );
  }

  if (node.kind === "parallel_split" || isParallelSplitNode(node)) {
    return null;
  }

  if (node.kind === "wait" || node.kind === "delay") {
    return (
      <FlowWaitCard
        node={node}
        selected={selected}
        pressing={pressing}
        invalid={invalid}
      />
    );
  }

  if (node.kind === "condition") {
    return (
      <FlowFilterCard
        node={node}
        selected={selected}
        pressing={pressing}
        invalid={invalid}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white px-4 py-3 ${
        selected ? cardShellClass(true, "ring-zinc-400/35") : ""
      }`}
    >
      <p className="text-xs font-semibold text-zinc-900">{node.label}</p>
    </div>
  );
}

export function FlowBranchContainer({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="relative w-full min-w-0 rounded-[1.25rem] border-2 border-dashed border-zinc-300/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
      <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6rem] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/90 sm:px-3 sm:text-[0.625rem]">
          <span
            className="size-2 rounded-full bg-[#1877f2] shadow-[0_0_8px_rgba(24,119,242,0.65)]"
            aria-hidden
          />
          Live
        </span>
        {title ? (
          <span className="truncate rounded-full bg-blue-50 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-blue-800 ring-1 ring-blue-200/80 sm:px-3 sm:text-[0.625rem]">
            {title}
          </span>
        ) : null}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:mt-11 sm:gap-4">{children}</div>
    </div>
  );
}

export function FlowParallelSplitCard({
  node,
  selected,
  pressing = false,
  invalid = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
  invalid?: boolean;
}) {
  const branchCount = Array.isArray(node.config.branches)
    ? node.config.branches.length
    : 0;

  return (
    <div
      className={`w-full max-w-sm overflow-hidden rounded-2xl border border-blue-200/80 bg-white transition-all ${
        invalid ? FLOW_STEP_INVALID_BLINK : ""
      } ${
        selected
          ? "ring-2 ring-[#1877f2]/50 shadow-[0_8px_30px_rgba(24,119,242,0.18)]"
          : pressing
            ? "scale-[0.99]"
            : "shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#1877f2] text-white shadow-sm">
          <GitBranch className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold tracking-tight text-blue-950">
            Parallel Split
          </p>
          <p className="text-[0.625rem] text-blue-700/80">
            Runs each branch independently
          </p>
        </div>
      </div>
      <div className="px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-zinc-800">
          {branchCount > 0
            ? `${branchCount} parallel path${branchCount === 1 ? "" : "s"}`
            : "Split into parallel paths"}
        </p>
      </div>
    </div>
  );
}
