import type { WorkflowNode } from "@/app/components/automation/types";

function configString(
  config: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

export function getTriggerTitle(node: WorkflowNode): string {
  return configString(node.config, "title", node.label);
}

export function getTriggerDescription(node: WorkflowNode): string {
  return configString(
    node.config,
    "description",
    "Guests enter this flow when they provide their information in a campaign funnel.",
  );
}

export function formatWaitSummary(config: Record<string, unknown>): string {
  const untilLabel = configString(config, "untilLabel", "").trim();
  if (untilLabel) {
    return `Until ${untilLabel}`;
  }

  const waitMode = configString(config, "waitMode", "");
  if (waitMode === "until_time") {
    return configString(config, "untilTime", configString(config, "time", "11:08 am"));
  }

  const delay =
    typeof config.delay === "number" && Number.isFinite(config.delay)
      ? config.delay
      : 15;
  const unit = configString(config, "unit", "minutes");
  const singular = unit.endsWith("s") ? unit.slice(0, -1) : unit;
  const label = delay === 1 ? singular : unit;
  return `${delay} ${label} elapsed`;
}

export function getFilterPills(node: WorkflowNode): {
  negated: boolean;
  label: string;
} {
  const raw = configString(
    node.config,
    "value",
    configString(node.config, "conditionType", "NOT Prepaid"),
  );
  if (raw === "true") {
    return { negated: true, label: "Status not paid" };
  }
  const negated = raw.toUpperCase().startsWith("NOT");
  const label = negated
    ? raw.replace(/^NOT\s+/i, "").trim() || "Prepaid for offer"
    : raw || "Prepaid for offer";
  return { negated, label };
}

export type FilterConditionDisplay = {
  negated: boolean;
  label: string;
};

export function getFilterConditions(node: WorkflowNode): FilterConditionDisplay[] {
  const rawList = node.config.conditions;
  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map((item) => {
      if (typeof item !== "object" || item == null) {
        return { negated: false, label: String(item) };
      }
      const record = item as Record<string, unknown>;
      const value = configString(record, "value", configString(record, "label", ""));
      const negated =
        record.negated === true || value.toUpperCase().startsWith("NOT");
      const label = negated
        ? value.replace(/^NOT\s+/i, "").trim() || value
        : value;
      return { negated, label };
    });
  }

  const single = getFilterPills(node);
  return [{ negated: single.negated, label: single.label }];
}

export function getSmsMessage(config: Record<string, unknown>): string {
  return configString(config, "message", "Your message will appear here.");
}

export function getSmsLinkLabel(config: Record<string, unknown>): string | null {
  const label =
    configString(config, "linkLabel", "").trim() ||
    configString(config, "ctaLabel", "").trim();
  return label || null;
}

export function getRewardName(config: Record<string, unknown>): string {
  return configString(config, "rewardName", "Campaign offer");
}

export function getExpirationNote(config: Record<string, unknown>): string {
  return configString(
    config,
    "expirationNote",
    configString(config, "expiration", "in 2 weeks"),
  );
}

export function formatExpirationDisplay(config: Record<string, unknown>): string {
  const raw = getExpirationNote(config).trim();
  return raw
    .replace(/^expires:\s*/i, "")
    .replace(/^set expiration (?:for .+? )?to\s*/i, "")
    .trim() || "in 2 weeks";
}

export function splitSmsPreviewParts(message: string): string[] {
  return message.split(/(\[[^\]]+\])/g);
}

export function isSmsMergeTag(part: string): boolean {
  return /^\[[^\]]+\]$/.test(part);
}

export function isReturnOfferEmailNode(node: {
  kind: string;
  config: Record<string, unknown>;
}): boolean {
  if (node.kind !== "create_coupon") {
    return false;
  }
  const message = String(node.config.message ?? "").trim();
  const subject = String(node.config.subject ?? "").trim();
  const rewardName = String(node.config.rewardName ?? "").trim();
  return Boolean(message || subject || rewardName);
}

export function getReturnOfferEmailPreview(
  config: Record<string, unknown>,
): string {
  const message = String(config.message ?? "").trim();
  if (message) {
    return message;
  }

  const rewardName = getRewardName(config);
  const expiration = formatExpirationDisplay(config);
  return `Hi [First Name] — we'd love to see you again! Your ${rewardName} is ready.\n\n${expiration}`;
}
