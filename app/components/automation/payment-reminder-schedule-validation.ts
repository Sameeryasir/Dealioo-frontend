import {
  configCronFrequency,
  configCronIntervalUnit,
  configCronIntervalValue,
  cronIntervalUnitLabel,
} from "@/app/components/automation/builder/cron-schedule-display";
import type { WorkflowNode } from "@/app/components/automation/types";

export type PaymentReminderScheduleValidation =
  | { ok: true }
  | {
      ok: false;
      message: string;
      cronIntervalMinutes: number;
      waitDelayMinutes: number;
    };

/** Mirrors backend wait parsing (`automation-wait.util.ts`). */
export function resolveWaitDelayMinutesFromConfig(
  config: Record<string, unknown>,
): number {
  const direct = Number(config.delayMinutes);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  const delay = Number(config.delay);
  if (!Number.isFinite(delay) || delay <= 0) {
    return 0;
  }

  const unit = String(config.unit ?? "minutes").trim().toLowerCase();
  if (unit.startsWith("hour")) {
    return delay * 60;
  }
  if (unit.startsWith("day")) {
    return delay * 60 * 24;
  }
  return delay;
}

function resolveCronIntervalMinutes(
  config: Record<string, unknown>,
): number | null {
  if (configCronFrequency(config) !== "interval") {
    return null;
  }

  const value = configCronIntervalValue(config);
  const unit = configCronIntervalUnit(config);
  if (unit === "hours") {
    return value * 60;
  }
  if (unit === "days") {
    return value * 60 * 24;
  }
  return value;
}

function formatMinutesLabel(minutes: number): string {
  if (minutes >= 60 * 24 && minutes % (60 * 24) === 0) {
    const days = minutes / (60 * 24);
    return `${days} ${cronIntervalUnitLabel(days, "days")}`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${cronIntervalUnitLabel(hours, "hours")}`;
  }
  return `${minutes} ${cronIntervalUnitLabel(minutes, "minutes")}`;
}

/** Wait between payment email and QR pass email, or longest wait in the flow. */
function findPaymentReminderWaitMinutes(nodes: WorkflowNode[]): number {
  const emailIndices = nodes
    .map((node, index) => (node.kind === "send_email" ? index : -1))
    .filter((index) => index >= 0);

  if (emailIndices.length >= 2) {
    const firstEmailIndex = emailIndices[0];
    const secondEmailIndex = emailIndices[1];
    let betweenEmailsWait = 0;

    for (let index = firstEmailIndex + 1; index < secondEmailIndex; index++) {
      const node = nodes[index];
      if (node.kind === "wait" || node.kind === "delay") {
        betweenEmailsWait = Math.max(
          betweenEmailsWait,
          resolveWaitDelayMinutesFromConfig(node.config),
        );
      }
    }

    if (betweenEmailsWait > 0) {
      return betweenEmailsWait;
    }
  }

  let maxWait = 0;
  for (const node of nodes) {
    if (node.kind === "wait" || node.kind === "delay") {
      maxWait = Math.max(
        maxWait,
        resolveWaitDelayMinutesFromConfig(node.config),
      );
    }
  }
  return maxWait;
}

export function validatePaymentReminderSchedule(
  nodes: WorkflowNode[],
  purpose: string | undefined | null,
  nodePatch?: { nodeId: string; config: Record<string, unknown> },
): PaymentReminderScheduleValidation {
  if (purpose !== "funnel_signup_payment_reminder") {
    return { ok: true };
  }

  const mergedNodes = nodePatch
    ? nodes.map((node) =>
        node.id === nodePatch.nodeId
          ? { ...node, config: nodePatch.config }
          : node,
      )
    : nodes;

  const cronNode = mergedNodes.find((node) => node.kind === "cron_trigger");
  if (!cronNode) {
    return { ok: true };
  }

  const cronIntervalMinutes = resolveCronIntervalMinutes(cronNode.config);
  if (cronIntervalMinutes === null) {
    return { ok: true };
  }

  const waitDelayMinutes = findPaymentReminderWaitMinutes(mergedNodes);
  if (waitDelayMinutes <= 0) {
    return { ok: true };
  }

  if (cronIntervalMinutes < waitDelayMinutes) {
    return {
      ok: false,
      message:
        `The cron schedule (every ${formatMinutesLabel(cronIntervalMinutes)}) cannot be shorter than the Wait step (${formatMinutesLabel(waitDelayMinutes)}). ` +
        "Increase the cron interval or reduce the wait time so guests do not get duplicate reminders before the QR pass email is sent.",
      cronIntervalMinutes,
      waitDelayMinutes,
    };
  }

  return { ok: true };
}
