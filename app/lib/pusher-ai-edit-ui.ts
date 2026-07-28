import { isPusherConfigured } from "@/app/lib/pusher-execution";

export { isPusherConfigured };

export const PUSHER_AI_EDIT_UI_EVENT = {
  RESULT: "ai-edit-ui-result",
} as const;

export const PUSHER_PRIVATE_CHANNEL_PREFIX = "private-";

export function pusherBusinessAiEditUiChannel(businessId: number): string {
  return `${PUSHER_PRIVATE_CHANNEL_PREFIX}business-ai-edit-ui-${businessId}`;
}

export type AiEditUiPusherResult = {
  success: boolean;
  message?: string;
  schema?: Record<string, unknown>;
  operationId?: string;
  correlationId?: string;
};

export type AiEditUiPusherPayload = {
  businessId: number;
  jobId: string;
  status: "completed" | "failed";
  result?: AiEditUiPusherResult;
  error?: string;
};

export function parseAiEditUiPusherPayload(
  data: unknown,
): AiEditUiPusherPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;

  const businessId = Number(row.businessId);
  const jobId = typeof row.jobId === "string" ? row.jobId.trim() : "";
  const status =
    row.status === "completed" || row.status === "failed" ? row.status : null;

  if (!Number.isFinite(businessId) || businessId < 1 || !jobId || !status) {
    return null;
  }

  return {
    businessId,
    jobId,
    status,
    ...(row.result != null && typeof row.result === "object"
      ? { result: row.result as AiEditUiPusherResult }
      : {}),
    ...(typeof row.error === "string" ? { error: row.error } : {}),
  };
}
