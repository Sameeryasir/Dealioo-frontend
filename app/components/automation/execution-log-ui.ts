import { getBlockByKind } from "@/app/components/automation/mock-data";
import { nodeTypeToBlockKind } from "@/app/services/automation/node-api";
import type { AutomationLog } from "@/app/services/automation/types";

export type LogDisplayTone = "info" | "success" | "warning" | "error";

export type LogDisplayStatus = "passed" | "failed" | "waiting" | "info";

export type LogDisplay = {
  heading: string;
  stepLabel: string;
  summary: string;
  details: string[];
  tone: LogDisplayTone;
  status: LogDisplayStatus;
  nodeId?: number | null;
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
    nodeId: null,
    ...partial,
  };
}

function statusLabel(status: LogDisplayStatus): string {
  if (status === "passed") return "Passed";
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

function waitSummary(message: string, config: Record<string, unknown>): string {
  const delay = config.delay;
  const unit = configString(config, "unit");
  if (typeof delay === "number" && unit) {
    return `Wait ${delay} ${unit}`;
  }
  const minutes = extractDelayMinutes(message);
  if (minutes != null) {
    if (minutes >= 1440 && minutes % 1440 === 0) {
      const days = minutes / 1440;
      return `Wait ${days} day${days === 1 ? "" : "s"}`;
    }
    if (minutes >= 60 && minutes % 60 === 0) {
      const hours = minutes / 60;
      return `Wait ${hours} hour${hours === 1 ? "" : "s"}`;
    }
    return `Wait ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  if (/wait skipped/i.test(message)) return "No delay — continued";
  if (/wait completed/i.test(message)) return "Wait finished";
  return message.trim() || "Wait step";
}

function conditionSummary(message: string, config: Record<string, unknown>): string {
  const rule =
    configString(config, "conditionType") ??
    configString(config, "value") ??
    "Condition checked";
  if (/guest completed payment|workflow stops/i.test(message)) {
    return `${rule} — stopped (guest paid)`;
  }
  if (/still unpaid|sending reminder/i.test(message)) {
    return `${rule} — still unpaid, continue`;
  }
  if (/visited and redeemed|customer visited/i.test(message)) {
    return `${rule} — visited, continue`;
  }
  if (/has not visited|waiting before visit/i.test(message)) {
    return `${rule} — not visited yet`;
  }
  if (/condition met/i.test(message)) return `${rule} — met, stop`;
  if (/condition not met/i.test(message)) return `${rule} — not met, continue`;
  return rule;
}

function emailSummary(message: string, config: Record<string, unknown>): string {
  const subject = configString(config, "subject");
  if (/email sent to/i.test(message) || /reward email sent/i.test(message)) {
    return subject ? `Sent: ${subject}` : "Email sent";
  }
  if (/email failed|send failed|skipped/i.test(message)) {
    return subject ? `Email: ${subject}` : message.trim();
  }
  return subject ? `Email: ${subject}` : "Send email";
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
  return display.heading;
}

export function isRunFinishedLogDisplay(display: LogDisplay): boolean {
  return display.heading === LOG_HEADING_RUN_FINISHED;
}

export function logDisplayForUser(log: AutomationLog): LogDisplay | null {
  const message = log.message.trim();
  const config = log.node?.config ?? {};
  const type = (log.node?.type ?? "").toLowerCase();
  const nodeName = nodeDisplayName(log);
  const nodeId = log.nodeId ?? log.node?.id ?? null;

  if (isNoiseMessage(message)) return null;

  if (log.error || /node execution failed|bulk .* send failed|all send attempts failed/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName,
      summary: (log.error ?? message).trim(),
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
      heading: nodeName,
      summary: message,
      tone: "warning",
      status: "passed",
      nodeId,
    });
  }

  if (isPrepOnlyMessage(message)) return null;

  if (/email sent to|reward email sent|qr pass email sent|payment reminder text sent|actions sent/i.test(message)) {
    return makeLogDisplay({
      heading: type === "email" || !type ? "Send Email" : nodeName,
      summary: emailSummary(message, config),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (/sms sent|whatsapp message sent/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName,
      summary: message,
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "trigger" || /trigger fired/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName,
      summary: "Started this automation",
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
      heading: nodeName,
      summary: waitSummary(message, config),
      tone: waiting ? "info" : "success",
      status: waiting ? "waiting" : "passed",
      nodeId,
    });
  }

  if (type === "condition" || /condition:/i.test(message) || /guest still unpaid|guest completed payment|customer visited|has not visited/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName,
      summary: conditionSummary(message, config),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "email") {
    if (/skipped/i.test(message)) {
      return makeLogDisplay({
        heading: nodeName,
        summary: message,
        tone: "warning",
        status: "passed",
        nodeId,
      });
    }
    return makeLogDisplay({
      heading: nodeName,
      summary: emailSummary(message, config),
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "tag" || /tag applied/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName,
      summary: message,
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (type === "coupon" || /reward offer prepared/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName,
      summary: message,
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  if (/prepaid offer batch|payment reminder started/i.test(message)) {
    return makeLogDisplay({
      heading: nodeName || "Start",
      summary: message,
      tone: "success",
      status: "passed",
      nodeId,
    });
  }

  return makeLogDisplay({
    heading: nodeName || "Step",
    summary: message,
    tone: "success",
    status: "passed",
    nodeId,
  });
}

function isEmailDeliveryMessage(message: string): boolean {
  return /email sent to|reward email sent|qr pass email sent|actions sent \d+ email/i.test(
    message,
  );
}

export function groupLogsForDisplay(logs: AutomationLog[]): LogDisplay[] {
  const displays: LogDisplay[] = [];
  const byNode = new Map<number, LogDisplay>();
  let pendingEmailSends = 0;
  let pendingEmailNodeId: number | null = null;
  let pendingEmailSubject: string | null = null;

  const flushEmailBatch = () => {
    if (pendingEmailSends === 0) return;
    const heading = "Send Email";
    const summary =
      pendingEmailSends === 1 && pendingEmailSubject
        ? `Sent: ${pendingEmailSubject}`
        : emailsDeliveredSummary(pendingEmailSends);
    const display = makeLogDisplay({
      heading,
      summary,
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
          const idx = displays.findIndex((d) => d.nodeId === pendingEmailNodeId);
          if (idx >= 0) displays[idx] = display;
        }
      }
    } else {
      displays.push(display);
    }
    pendingEmailSends = 0;
    pendingEmailNodeId = null;
    pendingEmailSubject = null;
  };

  for (const log of logs) {
    if (isNoiseMessage(log.message) || isPrepOnlyMessage(log.message)) {
      continue;
    }

    if (!log.error && isEmailDeliveryMessage(log.message)) {
      pendingEmailSends += 1;
      pendingEmailNodeId = log.nodeId ?? log.node?.id ?? pendingEmailNodeId;
      pendingEmailSubject =
        configString(log.node?.config ?? {}, "subject") ?? pendingEmailSubject;
      continue;
    }

    flushEmailBatch();

    const display = logDisplayForUser(log);
    if (!display) continue;

    const nodeId = display.nodeId;
    if (nodeId != null) {
      const existing = byNode.get(nodeId);
      if (existing) {
        if (scoreDisplay(display) >= scoreDisplay(existing)) {
          byNode.set(nodeId, display);
          const idx = displays.findIndex((d) => d.nodeId === nodeId);
          if (idx >= 0) displays[idx] = display;
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
