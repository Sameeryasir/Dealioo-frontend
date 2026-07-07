import type { AutomationLog } from "@/app/services/automation/types";

export type LogDisplayTone = "info" | "success" | "warning" | "error";

export type LogDisplay = {
  heading: string;
  stepLabel: string;
  summary: string;
  details: string[];
  tone: LogDisplayTone;
};

export const LOG_HEADING_EMAIL_SENT = "Email sent";
export const LOG_HEADING_RUN_FINISHED = "Run finished";

function makeLogDisplay(
  partial: Partial<LogDisplay> & Pick<LogDisplay, "heading" | "tone">,
): LogDisplay {
  return {
    stepLabel: "Step",
    summary: "",
    details: [],
    ...partial,
  };
}

function emailsDeliveredSummary(count: number): string {
  return `${count} email${count === 1 ? "" : "s"} delivered`;
}

function customersMatchedDetail(count: number): string {
  return count === 1 ? "1 customer matched" : `${count} customers matched`;
}

function customersReachedDetail(count: number): string {
  return count === 1 ? "1 customer reached" : `${count} customers reached`;
}

function emailDeliveredDisplay(count: number, heading = "Emails sent"): LogDisplay {
  return makeLogDisplay({
    heading,
    stepLabel: "Email delivered",
    summary: emailsDeliveredSummary(count),
    tone: "success",
  });
}

export function isEmailSentLogDisplay(display: LogDisplay): boolean {
  return display.heading === LOG_HEADING_EMAIL_SENT;
}

export function logActivityCardTitle(display: LogDisplay): string {
  if (display.stepLabel === "Email delivered" && display.summary.trim()) {
    return display.summary;
  }
  return display.heading;
}

export function isRunFinishedLogDisplay(display: LogDisplay): boolean {
  return display.heading === LOG_HEADING_RUN_FINISHED;
}

function configString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const v = config[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function extractConditionFromMessage(message: string): string | null {
  const match = message.match(/condition:\s*"([^"]+)"/i);
  return match?.[1] ?? null;
}

function extractRecipientCount(message: string): number | null {
  const match = message.match(/(\d+)\s+unpaid customer/i);
  if (match) return Number.parseInt(match[1]!, 10);
  const sentMatch = message.match(/sent to (\d+) customer/i);
  if (sentMatch) return Number.parseInt(sentMatch[1]!, 10);
  return null;
}

function stepLabelForOrder(order: number | undefined, suffix: string): string {
  const base = order != null ? `Step ${order}` : "Step";
  return `${base}, ${suffix}`;
}

export function logDisplayForUser(log: AutomationLog): LogDisplay {
  const message = log.message.trim();
  const config = log.node?.config ?? {};
  const type = log.node?.type?.toLowerCase();
  const order = log.node?.order;
  const stepLabel = order != null ? `Step ${order}` : "Step";

  if (log.error) {
    return makeLogDisplay({
      heading: "Something went wrong",
      stepLabel,
      summary: log.error,
      tone: "error",
    });
  }

  if (/email node:.*loaded/i.test(message) || /subject.*loaded/i.test(message)) {
    const subject =
      configString(config, "subject") ??
      extractConditionFromMessage(message) ??
      "your reminder email";
    const template = configString(config, "template");
    return makeLogDisplay({
      heading: subject ? `Email: ${subject}` : "Email prepared",
      stepLabel: stepLabelForOrder(order, "Email"),
      details: template ? [`Template: ${template}`] : [],
      tone: "info",
    });
  }

  if (/condition:/i.test(message) && /sending to/i.test(message)) {
    const rule =
      configString(config, "conditionType") ??
      extractConditionFromMessage(message) ??
      "the selected rule";
    const count = extractRecipientCount(message);
    return makeLogDisplay({
      heading: rule,
      stepLabel: stepLabelForOrder(order, "Rule"),
      details: count != null ? [customersMatchedDetail(count)] : [],
      tone: "info",
    });
  }

  if (/email sent to/i.test(message)) {
    return emailDeliveredDisplay(1, LOG_HEADING_EMAIL_SENT);
  }

  if (/flow completed/i.test(message)) {
    const count = extractRecipientCount(message);
    return makeLogDisplay({
      heading: LOG_HEADING_RUN_FINISHED,
      stepLabel: "Complete",
      details: count != null ? [customersReachedDetail(count)] : [],
      tone: "success",
    });
  }

  if (type === "email") {
    const subject = configString(config, "subject");
    return makeLogDisplay({
      heading: subject ? `Email: ${subject}` : "Email step",
      stepLabel: stepLabelForOrder(order, "Email"),
      tone: "info",
    });
  }

  if (type === "condition") {
    const rule = configString(config, "conditionType") ?? "Customer rule";
    return makeLogDisplay({
      heading: rule,
      stepLabel: stepLabelForOrder(order, "Rule"),
      tone: "info",
    });
  }

  return makeLogDisplay({
    heading: "Activity",
    stepLabel,
    tone: "info",
  });
}

export function groupLogsForDisplay(logs: AutomationLog[]): LogDisplay[] {
  const displays: LogDisplay[] = [];
  let emailBatchLogs: AutomationLog[] = [];

  const flushEmailBatch = () => {
    if (emailBatchLogs.length === 0) return;
    displays.push(emailDeliveredDisplay(emailBatchLogs.length));
    emailBatchLogs = [];
  };

  for (const log of logs) {
    const display = logDisplayForUser(log);
    if (isEmailSentLogDisplay(display)) {
      emailBatchLogs.push(log);
      continue;
    }
    flushEmailBatch();
    displays.push(display);
  }
  flushEmailBatch();

  return displays;
}
