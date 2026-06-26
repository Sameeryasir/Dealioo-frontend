"use client";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CalendarClock,
  Clock,
  Filter,
  Gift,
  MessageSquare,
  RotateCcw,
  Send,
  UserPlus,
} from "lucide-react";
import {
  FLOW_ACTIONS,
  FLOW_CRON,
  FLOW_FILTER,
  FLOW_TRIGGER,
  FLOW_WAIT,
} from "@/app/components/automation/builder/flow-step-colors";
import { formatCronScheduleSummary } from "@/app/components/automation/builder/cron-schedule-display";
import {
  formatExpirationDisplay,
  formatWaitSummary,
  getFilterConditions,
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
import { expandBundledActionsForDisplay, isBundledActionsNode, PREPAID_FIRST_EMAIL_DEFAULTS } from "@/app/components/automation/builder/bundled-actions";
import { isCustomerVisitedFilterNode } from "@/app/components/automation/builder/flow-layout";
import { isActionNodeKind } from "@/app/components/automation/automation-ui";
import type { WorkflowNode } from "@/app/components/automation/types";

function cardShellClass(selected: boolean, ringClass: string): string {
  return selected
    ? `ring-2 ring-offset-2 ring-offset-[#ececee] ${ringClass} shadow-lg`
    : "shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]";
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
        <p className="text-sm font-bold tracking-tight">{title}</p>
        {subtitle ? (
          <p className={`text-[0.6875rem] ${subtitleClass}`}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FlowTriggerCard({
  node,
  selected,
  pressing = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${FLOW_TRIGGER.border} ${FLOW_TRIGGER.bg} transition-all ${
        selected ? cardShellClass(true, FLOW_TRIGGER.ring) : pressing ? "scale-[0.99]" : ""
      }`}
    >
      <div className="px-5 py-5">
        <div
          className={`mb-3 flex size-9 items-center justify-center rounded-xl ring-1 ${FLOW_TRIGGER.iconWrap}`}
        >
          <UserPlus className={`size-4 ${FLOW_TRIGGER.icon}`} strokeWidth={2.25} aria-hidden />
        </div>
        <p className={`text-[0.6875rem] font-bold uppercase tracking-[0.16em] ${FLOW_TRIGGER.label}`}>
          Trigger
        </p>
        <h3 className={`mt-1 text-xl font-bold leading-tight tracking-tight ${FLOW_TRIGGER.title}`}>
          {getTriggerTitle(node)}
        </h3>
        <p className={`mt-2.5 text-sm leading-relaxed ${FLOW_TRIGGER.body}`}>
          {getTriggerDescription(node)}
        </p>
      </div>
    </div>
  );
}

export function FlowCronJobCard({
  node,
  selected,
  pressing = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
}) {
  const schedule = formatCronScheduleSummary(node.config);

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${FLOW_CRON.border} bg-white transition-all ${
        selected ? cardShellClass(true, FLOW_CRON.ring) : pressing ? "scale-[0.99]" : ""
      }`}
    >
      <FlowStepHeader
        icon={CalendarClock}
        title="Cron Job"
        subtitle="Runs on a schedule"
        iconClass={FLOW_CRON.icon}
        barClass={FLOW_CRON.header}
        subtitleClass={FLOW_CRON.headerSub}
      />
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <p className={`text-lg font-bold tracking-tight ${FLOW_CRON.body}`}>
          {schedule}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Checks unpaid guests, then continues the flow.
        </p>
      </div>
    </div>
  );
}

export function FlowWaitCard({
  node,
  selected,
  pressing = false,
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${FLOW_WAIT.border} bg-white transition-all ${
        selected ? cardShellClass(true, FLOW_WAIT.ring) : pressing ? "scale-[0.99]" : ""
      }`}
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
        <p className={`text-lg font-bold tracking-tight ${FLOW_WAIT.body}`}>
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
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
}) {
  const conditions = getFilterConditions(node);
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${FLOW_FILTER.border} bg-white transition-all ${
        selected ? cardShellClass(true, FLOW_FILTER.ring) : pressing ? "scale-[0.99]" : ""
      }`}
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
              <span className="text-xs font-semibold lowercase text-zinc-500">and</span>
            ) : null}
            {condition.negated ? (
              <span
                className={`rounded-full px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wide shadow-sm ${FLOW_FILTER.notPill}`}
              >
                NOT
              </span>
            ) : null}
            <span
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ${FLOW_FILTER.valuePill}`}
            >
              {condition.label}
            </span>
          </span>
        ))}
      </div>
      {isCustomerVisitedFilterNode(node) ? (
        <div className="grid gap-2 border-t border-zinc-100 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-amber-800">
              If not visited
            </p>
            <p className="mt-1 text-xs font-medium text-amber-950">
              {String(node.config.branchLabelFalse ?? "Restart from first email")}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-800">
              If visited
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-950">
              {String(node.config.branchLabelTrue ?? "Continue post-visit emails")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PrepaidLoopBackCard({
  loopTarget,
}: {
  loopTarget: WorkflowNode | null;
}) {
  const previewSubject =
    loopTarget != null
      ? String(loopTarget.config?.subject ?? "").trim()
      : "";
  const previewMessage =
    loopTarget?.config?.actions &&
    Array.isArray(loopTarget.config.actions) &&
    typeof loopTarget.config.actions[0] === "object" &&
    loopTarget.config.actions[0] != null
      ? String(
          (loopTarget.config.actions[0] as Record<string, unknown>).message ??
            "",
        ).trim()
      : String(loopTarget?.config?.message ?? "").trim() ||
        PREPAID_FIRST_EMAIL_DEFAULTS.message;

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50/80 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <RotateCcw className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight text-zinc-900">
            Loop back
          </p>
          <p className="text-xs font-medium text-amber-800">
            Customer not visited → restart from first email
          </p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-700">
          Send Email
        </p>
        {previewSubject ? (
          <p className="mt-1 text-xs font-semibold text-zinc-800">{previewSubject}</p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
          {previewMessage || "Restart from the first offer email with pass link."}
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
      return { label: "Set Reward Expiration", icon: CalendarClock };
    default:
      return { label: node.label, icon: Send };
  }
}

function FlowActionStepBody({ node }: { node: WorkflowNode }) {
  const config = node.config;
  const linkLabel = getSmsLinkLabel(config);

  if (
    node.kind === "send_sms" ||
    node.kind === "send_email" ||
    node.kind === "send_whatsapp" ||
    isReturnOfferEmailNode(node)
  ) {
    const previewMessage = isReturnOfferEmailNode(node)
      ? getReturnOfferEmailPreview(config)
      : getSmsMessage(config);
    const parts = splitSmsPreviewParts(previewMessage);
    return (
      <div className="space-y-2.5 text-left">
        <p className="whitespace-pre-wrap text-left text-[0.9375rem] leading-relaxed text-zinc-700">
          {parts.map((part, index) =>
            isSmsMergeTag(part) ? (
              <span
                key={`${part}-${index}`}
                className="mx-0.5 inline rounded-md bg-sky-100 px-1.5 py-0.5 font-semibold text-sky-800"
              >
                {part}
              </span>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            ),
          )}
        </p>
        {linkLabel ? (
          <span className="inline-flex items-center rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            {linkLabel}
          </span>
        ) : null}
      </div>
    );
  }

  if (node.kind === "create_coupon") {
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-900">
          Offer:{" "}
          <span className="font-bold text-zinc-950">{getRewardName(config)}</span>
        </p>
        <p className="text-xs leading-relaxed text-zinc-500">
          Expires: {formatExpirationDisplay(config)}
        </p>
      </div>
    );
  }

  if (node.kind === "tag_customer") {
    return (
      <p className="text-sm leading-relaxed text-zinc-700">
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
}: {
  node: WorkflowNode;
  selected?: boolean;
}) {
  const { label, icon: Icon } = actionMeta(node);
  return (
    <div
      className={`rounded-xl border transition-all ${
        selected ? FLOW_ACTIONS.stepSelected : FLOW_ACTIONS.stepDefault
      }`}
    >
      <div className="flex items-start gap-3.5 px-4 py-4 sm:px-5 sm:py-5">
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${FLOW_ACTIONS.stepIcon}`}
        >
          <Icon className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-emerald-700/70">
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
        <p className="text-sm font-bold tracking-tight">Actions</p>
        <p className={`text-[0.6875rem] ${FLOW_ACTIONS.headerSub}`}>
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
        <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 text-[0.6875rem] text-zinc-400">
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
}: {
  nodes: WorkflowNode[];
  selectedId?: string | null;
  ownerNodeId?: string;
  footer?: ReactNode;
}) {
  const groupSelected =
    (ownerNodeId != null && selectedId === ownerNodeId) ||
    nodes.some((node) => node.id === selectedId);
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all ${
        groupSelected ? `border-emerald-300 ring-2 ${FLOW_ACTIONS.ring}` : FLOW_ACTIONS.border
      }`}
    >
      <FlowActionsBlockHeader />
      <FlowActionsGroupBody footer={footer}>
        {nodes.map((node) => (
          <FlowActionStepContent
            key={node.id}
            node={node}
            selected={
              groupSelected ||
              selectedId === node.id
            }
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
}: {
  node: WorkflowNode;
  selected?: boolean;
  pressing?: boolean;
}) {
  if (isBundledActionsNode(node)) {
    return (
      <FlowActionsBlock
        nodes={expandBundledActionsForDisplay(node)}
        selectedId={selected ? node.id : null}
      />
    );
  }

  if (isActionNodeKind(node.kind)) {
    return (
      <FlowActionsBlock nodes={[node]} selectedId={selected ? node.id : null} />
    );
  }

  if (node.kind === "cron_trigger") {
    return <FlowCronJobCard node={node} selected={selected} pressing={pressing} />;
  }

  if (
    node.kind === "signup_trigger" ||
    node.kind === "payment_trigger" ||
    node.kind === "funnel_complete"
  ) {
    return <FlowTriggerCard node={node} selected={selected} pressing={pressing} />;
  }

  if (node.kind === "wait" || node.kind === "delay") {
    return <FlowWaitCard node={node} selected={selected} pressing={pressing} />;
  }

  if (node.kind === "condition") {
    return <FlowFilterCard node={node} selected={selected} pressing={pressing} />;
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white px-4 py-3 ${
        selected ? cardShellClass(true, "ring-zinc-400/35") : ""
      }`}
    >
      <p className="text-sm font-semibold text-zinc-900">{node.label}</p>
    </div>
  );
}

export function FlowBranchContainer({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full min-w-0 rounded-[1.25rem] border-2 border-dashed border-zinc-300/70 bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6">
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200/90 sm:left-4 sm:top-4 sm:px-3 sm:text-[0.6875rem]">
        <span
          className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.65)]"
          aria-hidden
        />
        Live
      </span>
      <div className="mt-10 flex flex-col gap-3 sm:mt-11 sm:gap-4">{children}</div>
    </div>
  );
}
