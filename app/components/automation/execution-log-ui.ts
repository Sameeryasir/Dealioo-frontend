import { getBlockByKind } from "@/app/components/automation/mock-data";
import { nodeTypeToBlockKind } from "@/app/services/automation/node-api";
import type { AutomationLog } from "@/app/services/automation/types";

export type LogDisplayTone = "info" | "success" | "warning" | "error";

export type LogDisplayStatus = "passed" | "failed" | "waiting" | "info";

export type LogRecipientResult = {
  label: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
};

export type LogDisplay = {
  heading: string;
  stepLabel: string;
  summary: string;
  details: string[];
  recipients: LogRecipientResult[];
  tone: LogDisplayTone;
  status: LogDisplayStatus;
  nodeId?: number | null;
};

export type RunActivitySummary = {
  sent: number;
  failed: number;
  skipped: number;
};

export const LOG_HEADING_EMAIL_SENT = "Email sent";
export const LOG_HEADING_RUN_FINISHED = "Run finished";

function makeLogDisplay(
  partial: Partial<LogDisplay> & Pick<LogDisplay, "heading" | "tone" | "status">,
): LogDisplay {
  return {
    stepLabel: statusLabel(partial.status),
    summary: "",
    details: [],
    recipients: [],
    nodeId: null,
    ...partial,
  };
}

function statusLabel(status: LogDisplayStatus): string {
  if (status === "passed") return "Done";
  if (status === "failed") return "Failed";
  if (status === "waiting") return "Waiting";
  return "In progress";
}

function configString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const v = config[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function nodeDisplayName(log: AutomationLog): string {
  const config = log.node?.config ?? {};
  const titled = configString(config, "title");
  if (titled) return titled;

  const type = log.node?.type ?? "";
  const kind = nodeTypeToBlockKind(type, config);
  return getBlockByKind(kind).label;
}

function emailsDeliveredSummary(count: number): string {
  return `${count} email${count === 1 ? "" : "s"} delivered`;
}

function extractBulkEmailSendCount(message: string): number | null {
  const match = message.match(/actions sent\s+(\d+)\s+email/i);
  if (!match) return null;
  const count = Number.parseInt(match[1]!, 10);
  return Number.isFinite(count) && count > 0 ? count : null;
}

function extractEmailFromMessage(message: string): string | null {
  const match = message.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  return match?.[0]?.trim() ?? null;
}

function redactEmailAddresses(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function isPrepOnlyMessage(message: string): boolean {
  return (
    /email node:.*loaded/i.test(message) ||
    /subject.*loaded/i.test(message) ||
    /SMS node loaded/i.test(message) ||
    /queued \d+ send chunk/i.test(message) ||
    /sending to \d+ guest/i.test(message) ||
    /chunk \d+\/\d+: sending/i.test(message)
  );
}

function isNoiseMessage(message: string): boolean {
  return (
    /previous run closed after resume/i.test(message) ||
    /rechecking unpaid guests/i.test(message)
  );
}

function extractDelayMinutes(message: string): number | null {
  const match = message.match(/(\d+)\s+minutes?/i);
  return match ? Number.parseInt(match[1]!, 10) : null;
}

function formatWaitDuration(
  delay: number,
  unit: string | null,
  minutesFromMessage: number | null,
): string | null {
  if (Number.isFinite(delay) && unit) {
    const u = unit.toLowerCase();
    const label =
      u.startsWith("day")
        ? delay === 1
          ? "day"
          : "days"
        : u.startsWith("hour")
          ? delay === 1
            ? "hour"
            : "hours"
          : delay === 1
            ? "minute"
            : "minutes";
    return `${delay} ${label}`;
  }
  if (minutesFromMessage == null) return null;
  const minutes = minutesFromMessage;
  if (minutes >= 1440 && minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function waitHeading(
  message: string,
  config: Record<string, unknown>,
  waiting: boolean,
): string {
  if (/wait skipped/i.test(message)) return "No wait — continued";
  const duration = formatWaitDuration(
    typeof config.delay === "number" ? config.delay : NaN,
    configString(config, "unit"),
    extractDelayMinutes(message),
  );
  if (duration) {
    return waiting ? `Waiting ${duration}` : `Waited ${duration}`;
  }
  if (/wait completed/i.test(message)) return "Wait finished";
  return waiting ? "Waiting…" : "Wait finished";
}

function conditionHeading(message: string): string {
  if (/guest completed payment|workflow stops/i.test(message)) {
    return "Checked unpaid — guest paid, stopped";
  }
  if (/still unpaid|sending reminder/i.test(message)) {
    return "Checked unpaid — still unpaid";
  }
  if (/visited and redeemed|customer visited/i.test(message)) {
    return "Checked visit — visited";
  }
  if (/has not visited|waiting before visit/i.test(message)) {
    return "Checked visit — not visited yet";
  }
  if (/condition met/i.test(message)) return "Condition met — stopped";
  if (/condition not met/i.test(message)) return "Condition not met — continued";
  return "Checked condition";
}

function emailSummary(message: string, config: Record<string, unknown>): string {
  const bulkCount = extractBulkEmailSendCount(message);
  if (bulkCount != null) {
    return emailsDeliveredSummary(bulkCount);
  }
  if (
    /email sent to|reward email sent|qr pass email sent|action email sent|payment reminder email sent/i.test(
      message,
    )
  ) {
    return emailsDeliveredSummary(1);
  }
  if (/email failed|send failed/i.test(message)) {
    const subject = configString(config, "subject");
    return subject ? `Could not send: ${subject}` : "Email failed";
  }
  if (/skipped/i.test(message)) {
    return redactEmailAddresses(message) || "Email skipped";
  }
  const subject = configString(config, "subject");
  return subject ? `Email: ${subject}` : "Send email";
}

function recipientFromDeliveryLog(log: AutomationLog): LogRecipientResult {
  const email = extractEmailFromMessage(log.message);
  const label =
    email ??
    (log.customerId ? `Customer #${log.customerId}` : "Customer");
  if (/skipped/i.test(log.message)) {
    return {
      label,
      status: "skipped",
      reason: redactEmailAddresses(log.message) || undefined,
    };
  }
  if (log.error || /failed/i.test(log.message)) {
    return {
      label,
      status: "failed",
      reason:
        redactEmailAddresses((log.error ?? log.message).trim()) || undefined,
    };
  }
  return { label, status: "sent" };
}

function scoreDisplay(display: LogDisplay): number {
  if (display.status === "failed") return 40;
  if (display.status === "passed") return 30;
  if (display.status === "waiting") return 20;
  return 10;
}

export function isEmailSentLogDisplay(display: LogDisplay): boolean {
  return display.heading === LOG_HEADING_EMAIL_SENT;
}

export function logActivityCardTitle(display: LogDisplay): string {
  if (display.heading === LOG_HEADING_EMAIL_SENT) {
    const fromRecipients = display.recipients.filter(
      (r) => r.status === "sent",
    ).length;
    const match = display.summary.match(/(\d+)\s+email/i);
    const fromSummary = match ? Number.parseInt(match[1]!, 10) : 0;
    const count =
      fromRecipients > 0
        ? fromRecipients
        : Number.isFinite(fromSummary) && fromSummary > 0
          ? fromSummary
          : 0;
    if (count > 0) {
      return `Email sent · ${count} delivered`;
    }
    return LOG_HEADING_EMAIL_SENT;
  }

  if (/email failed/i.test(display.heading)) {
    const failedFromRecipients = display.recipients.filter(
      (r) => r.status === "failed",
    ).length;
    if (failedFromRecipients > 0) {
      return `Email failed · ${failedFromRecipients}`;
    }
  }

  return display.heading;
}

export function isRunFinishedLogDisplay(display: LogDisplay): boolean {
  return display.heading === LOG_HEADING_RUN_FINISHED;
}

export function summarizeRunActivity(
  displays: LogDisplay[],
): RunActivitySummary {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const display of displays) {
    if (display.recipients.length > 0) {
      for (const recipient of display.recipients) {
        if (recipient.status === "sent") sent += 1;
        else if (recipient.status === "failed") failed += 1;
        else skipped += 1;
      }
      continue;
    }

    if (isEmailSentLogDisplay(display) || /email sent/i.test(display.heading)) {
      const match = display.summary.match(/(\d+)\s+email/i);
      const count = match ? Number.parseInt(match[1]!, 10) : 1;
      if (Number.isFinite(count) && count > 0) sent += count;
      else sent += 1;
    } else if (display.status === "failed" && /email/i.test(display.heading)) {
      failed += 1;
    } else if (/skipped/i.test(display.summary) || /skipped/i.test(display.heading)) {
      skipped += 1;
    }
  }

  return { sent, failed, skipped };
}

export function logDisplayForUser(log: AutomationLog): LogDisplay | null {
  const message = log.message.trim();
  const config = log.node?.config ?? {};
  const type = (log.node?.type ?? "").toLowerCase();
  const nodeName = nodeDisplayName(log);
  const nodeId = log.nodeId ?? log.node?.id ?? null;

  if (isNoiseMessage(message)) return null;

  if (
    log.error ||
    /node execution failed|bulk .* send failed|all send attempts failed/i.test(
      message,
    )
  ) {
    const recipient = extractEmailFromMessage(message);
    return makeLogDisplay({
      heading: /email/i.test(type) || /email/i.test(nodeName)
        ? "Email failed"
        : nodeName,
      summary: redactEmailAddresses((log.error ?? message).trim()),
      recipients: recipient
        ? [
            {
              label: recipient,
              status: "failed",
              reason: redactEmailAddresses((log.error ?? message).trim()) || undefined,
            },
          ]
        : [],
      tone: "error",
      status: "failed",
      nodeId,
    });
  }

  if (/workflow completed|flow completed|run finished/i.test(message)) {
    return makeLogDisplay({
      heading: LOG_HEADING_RUN_FINISHED,
      summary: "All reached steps completed",
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (/workflow stopped|automation paused/i.test(message)) {
    return makeLogDisplay({
      heading: "Run paused",
      summary: redactEmailAddresses(message),
      tone: "warning",
      status: "passed",
      nodeId,
    });
  }

  if (isPrepOnlyMessage(message)) return null;

  if (
    /email sent to|reward email sent|qr pass email sent|payment reminder email sent|action email sent|payment reminder text sent|actions sent/i.test(
      message,
    )
  ) {
    const recipient = recipientFromDeliveryLog(log);
    return makeLogDisplay({
      heading: LOG_HEADING_EMAIL_SENT,
      summary: emailSummary(message, config),
      recipients: [recipient],
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (/sms sent|whatsapp message sent/i.test(message)) {
    return makeLogDisplay({
      heading: /whatsapp/i.test(message) ? "WhatsApp sent" : "SMS sent",
      summary: redactEmailAddresses(message),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (
    type === "trigger" ||
    /trigger fired|cron fired|cron trigger fired/i.test(message)
  ) {
    const unpaidMatch = message.match(/(\d+)\s+unpaid guest/i);
    return makeLogDisplay({
      heading: "Started",
      summary: unpaidMatch
        ? `Found ${unpaidMatch[1]} unpaid guest${unpaidMatch[1] === "1" ? "" : "s"}`
        : "Automation started this run",
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (
    type === "wait" ||
    /delay scheduled|wait completed|wait skipped|wait \d+/i.test(message)
  ) {
    const waiting = /delay scheduled/i.test(message);
    return makeLogDisplay({
      heading: waitHeading(message, config, waiting),
      summary: "",
      tone: waiting ? "info" : "success",
      status: waiting ? "waiting" : "passed",
      nodeId,
    });
  }

  if (
    type === "condition" ||
    /condition:/i.test(message) ||
    /guest still unpaid|guest completed payment|customer visited|has not visited/i.test(
      message,
    )
  ) {
    return makeLogDisplay({
      heading: conditionHeading(message),
      summary: "",
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "email") {
    if (/skipped/i.test(message)) {
      const recipient = recipientFromDeliveryLog(log);
      return makeLogDisplay({
        heading: "Email skipped",
        summary: redactEmailAddresses(message),
        recipients: [recipient],
        tone: "warning",
        status: "passed",
        nodeId,
      });
    }
    return makeLogDisplay({
      heading: LOG_HEADING_EMAIL_SENT,
      summary: emailSummary(message, config),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "tag" || /tag applied/i.test(message)) {
    return makeLogDisplay({
      heading: "Tag applied",
      summary: redactEmailAddresses(message),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "coupon" || /reward offer prepared/i.test(message)) {
    return makeLogDisplay({
      heading: "Reward prepared",
      summary: redactEmailAddresses(message),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (/prepaid offer batch|payment reminder started/i.test(message)) {
    return makeLogDisplay({
      heading: "Started",
      summary: redactEmailAddresses(message),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  return makeLogDisplay({
    heading: nodeName || "Step",
    summary: redactEmailAddresses(message),
    tone: "success",
    status: "passed",
    nodeId,
  });
}

function isEmailDeliveryMessage(message: string): boolean {
  return /email sent to|reward email sent|qr pass email sent|action email sent|payment reminder email sent|actions sent \d+ email/i.test(
    message,
  );
}

export function groupLogsForDisplay(logs: AutomationLog[]): LogDisplay[] {
  const displays: LogDisplay[] = [];
  const byNode = new Map<number, LogDisplay>();
  let pendingEmailRecipients: LogRecipientResult[] = [];
  let pendingEmailNodeId: number | null = null;

  const flushEmailBatch = () => {
    if (pendingEmailRecipients.length === 0) return;
    const sentCount = pendingEmailRecipients.filter(
      (r) => r.status === "sent",
    ).length;
    const display = makeLogDisplay({
      heading: LOG_HEADING_EMAIL_SENT,
      summary: emailsDeliveredSummary(
        sentCount > 0 ? sentCount : pendingEmailRecipients.length,
      ),
      recipients: [...pendingEmailRecipients],
      tone: "success",
      status: "passed",
      nodeId: pendingEmailNodeId,
    });
    if (pendingEmailNodeId != null) {
      const existing = byNode.get(pendingEmailNodeId);
      if (!existing || scoreDisplay(display) >= scoreDisplay(existing)) {
        byNode.set(pendingEmailNodeId, display);
        if (!existing) displays.push(display);
        else {
          const idx = displays.findIndex(
            (d) => d.nodeId === pendingEmailNodeId,
          );
          if (idx >= 0) displays[idx] = display;
        }
      }
    } else {
      displays.push(display);
    }
    pendingEmailRecipients = [];
    pendingEmailNodeId = null;
  };

  for (const log of logs) {
    if (isNoiseMessage(log.message) || isPrepOnlyMessage(log.message)) {
      continue;
    }

    if (!log.error && isEmailDeliveryMessage(log.message)) {
      const bulkCount = extractBulkEmailSendCount(log.message);
      if (bulkCount != null && bulkCount > 1 && !extractEmailFromMessage(log.message)) {
        for (let i = 0; i < bulkCount; i += 1) {
          pendingEmailRecipients.push({
            label: `Recipient ${pendingEmailRecipients.length + 1}`,
            status: "sent",
          });
        }
      } else {
        pendingEmailRecipients.push(recipientFromDeliveryLog(log));
      }
      pendingEmailNodeId = log.nodeId ?? log.node?.id ?? pendingEmailNodeId;
      continue;
    }

    flushEmailBatch();

    const display = logDisplayForUser(log);
    if (!display) continue;

    display.summary = redactEmailAddresses(display.summary);
    display.details = display.details
      .map((line) => redactEmailAddresses(line))
      .filter((line) => line.length > 0);

    const nodeId = display.nodeId;
    if (nodeId != null) {
      const existing = byNode.get(nodeId);
      if (existing) {
        if (scoreDisplay(display) >= scoreDisplay(existing)) {
          const mergedRecipients =
            display.recipients.length > 0
              ? display.recipients
              : existing.recipients;
          const next = { ...display, recipients: mergedRecipients };
          byNode.set(nodeId, next);
          const idx = displays.findIndex((d) => d.nodeId === nodeId);
          if (idx >= 0) displays[idx] = next;
        }
        continue;
      }
      byNode.set(nodeId, display);
    }

    displays.push(display);

    if (display.status === "failed") {
      flushEmailBatch();
      break;
    }
  }

  flushEmailBatch();
  return displays;
}
