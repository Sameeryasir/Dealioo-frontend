import type { AutomationLog } from "@/app/services/automation/types";

export type LogDisplayTone = "info" | "success" | "warning" | "error";

export type LogDisplay = {
  heading: string;
  stepLabel: string;
  summary: string;
  details: string[];
  tone: LogDisplayTone;
};

function configString(
  config: Record<string, unknown>,
  key: string,
): string | null {
  const v = config[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function extractEmailFromSentMessage(message: string): string | null {
  const match = message.match(/sent to\s+(\S+@\S+)/i);
  return match?.[1] ?? null;
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

/** Turns one API log row into plain language for restaurant owners. */
export function logDisplayForUser(log: AutomationLog): LogDisplay {
  const message = log.message.trim();
  const config = log.node?.config ?? {};
  const type = log.node?.type?.toLowerCase();
  const order = log.node?.order;
  const stepLabel =
    order != null ? `Step ${order}` : "Step";

  if (log.error) {
    return {
      heading: "Something went wrong",
      stepLabel,
      summary: log.error,
      details: [],
      tone: "error",
    };
  }

  if (/email node:.*loaded/i.test(message) || /subject.*loaded/i.test(message)) {
    const subject =
      configString(config, "subject") ??
      extractConditionFromMessage(message) ??
      "your reminder email";
    const template = configString(config, "template");
    return {
      heading: subject ? `Email: ${subject}` : "Email prepared",
      stepLabel: `${stepLabel} · Email`,
      summary: "",
      details: template ? [`Template: ${template}`] : [],
      tone: "info",
    };
  }

  if (/condition:/i.test(message) && /sending to/i.test(message)) {
    const rule =
      configString(config, "conditionType") ??
      extractConditionFromMessage(message) ??
      "the selected rule";
    const count = extractRecipientCount(message);
    return {
      heading: rule,
      stepLabel: `${stepLabel} · Rule`,
      summary: "",
      details:
        count != null
          ? [
              count === 1
                ? "1 customer matched"
                : `${count} customers matched`,
            ]
          : [],
      tone: "info",
    };
  }

  if (/email sent to/i.test(message)) {
    return {
      heading: "Emails sent",
      stepLabel: "Email delivered",
      summary: "1 email delivered",
      details: [],
      tone: "success",
    };
  }

  if (/flow completed/i.test(message)) {
    const count = extractRecipientCount(message);
    return {
      heading: "Run finished",
      stepLabel: "Complete",
      summary: "",
      details:
        count != null
          ? [
              count === 1
                ? "1 customer reached"
                : `${count} customers reached`,
            ]
          : [],
      tone: "success",
    };
  }

  if (type === "email") {
    const subject = configString(config, "subject");
    return {
      heading: subject ? `Email: ${subject}` : "Email step",
      stepLabel: `${stepLabel} · Email`,
      summary: "",
      details: [],
      tone: "info",
    };
  }

  if (type === "condition") {
    const rule = configString(config, "conditionType") ?? "Customer rule";
    return {
      heading: rule,
      stepLabel: `${stepLabel} · Rule`,
      summary: "",
      details: [],
      tone: "info",
    };
  }

  return {
    heading: "Activity",
    stepLabel,
    summary: "",
    details: [],
    tone: "info",
  };
}

/** Groups back-to-back “email sent” lines into one card when useful. */
export function groupLogsForDisplay(logs: AutomationLog[]): LogDisplay[] {
  const displays: LogDisplay[] = [];
  let emailBatchLogs: AutomationLog[] = [];

  const flushEmailBatch = () => {
    if (emailBatchLogs.length === 0) return;
    const count = emailBatchLogs.length;
    displays.push({
      heading: "Emails sent",
      stepLabel: "Email delivered",
      summary: `${count} email${count === 1 ? "" : "s"} delivered`,
      details: [],
      tone: "success",
    });
    emailBatchLogs = [];
  };

  for (const log of logs) {
    const display = logDisplayForUser(log);
    if (display.heading === "Email sent") {
      emailBatchLogs.push(log);
      continue;
    }
    flushEmailBatch();
    displays.push(display);
  }
  flushEmailBatch();

  return displays;
}
