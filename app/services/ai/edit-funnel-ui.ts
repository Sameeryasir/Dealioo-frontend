import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import {
  isPusherConfigured,
  type AiEditUiPusherPayload,
} from "@/app/lib/pusher-ai-edit-ui";
import { subscribeAiEditUiResult } from "@/app/lib/pusher-client";

const AI_ENQUEUE_TIMEOUT_MS = 15_000;
const AI_PUSHER_MAX_MS = 120_000;

export type EditFunnelUiRequest = {
  businessId: number;
  campaignId?: number;
  funnelId?: number;
  pageId?: string;
  userInstruction: string;
  editableFields?: Record<string, unknown>;
  fieldConstraints?: Record<string, readonly string[]>;
  currentSchema?: Record<string, unknown>;
  correlationId?: string;
};

export type EditFunnelUiResponse = {
  success: boolean;
  message?: string;
  schema?: Record<string, unknown>;
  operationId?: string;
  correlationId?: string;
};

type EnqueueResponse = {
  jobId: string;
  status: "queued";
};

async function enqueueEditFunnelUi(
  body: EditFunnelUiRequest,
): Promise<EnqueueResponse> {
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/ai/edit-ui`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    AI_ENQUEUE_TIMEOUT_MS,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not start AI edit job."),
    );
  }

  return (await res.json()) as EnqueueResponse;
}

function waitForAiEditUiPusherResult(input: {
  businessId: number;
  getJobId: () => string | null;
  startEnqueue: () => Promise<string>;
}): Promise<EditFunnelUiResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let jobId: string | null = null;
    let unsubscribe: (() => void) | null = null;

    const cleanup = () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      window.clearTimeout(timeoutId);
    };

    const finishError = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const finishOk = (result: EditFunnelUiResponse) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const timeoutId = window.setTimeout(() => {
      finishError(
        new Error(
          "AI is still working on that edit. Please try again in a moment.",
        ),
      );
    }, AI_PUSHER_MAX_MS);

    const onResult = (payload: AiEditUiPusherPayload) => {
      const expectedJobId = jobId ?? input.getJobId();
      if (!expectedJobId || payload.jobId !== expectedJobId) return;
      if (payload.businessId !== input.businessId) return;

      if (payload.status === "failed") {
        finishError(new Error(payload.error || "AI edit job failed."));
        return;
      }

      if (!payload.result) {
        finishError(new Error("AI edit job completed without a result."));
        return;
      }

      finishOk(payload.result);
    };

    unsubscribe = subscribeAiEditUiResult(input.businessId, onResult);

    void input
      .startEnqueue()
      .then((id) => {
        jobId = id;
      })
      .catch((error) => {
        finishError(
          error instanceof Error
            ? error
            : new Error("Could not start AI edit job."),
        );
      });
  });
}

export async function editFunnelUiWithAi(
  body: EditFunnelUiRequest,
): Promise<EditFunnelUiResponse> {
  if (!Number.isFinite(body.businessId) || body.businessId < 1) {
    throw new Error("Valid businessId is required.");
  }
  if (!body.userInstruction.trim()) {
    throw new Error("A user instruction is required.");
  }
  if (!isPusherConfigured()) {
    throw new Error(
      "Realtime is not configured. Set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER.",
    );
  }

  let resolvedJobId: string | null = null;

  return waitForAiEditUiPusherResult({
    businessId: body.businessId,
    getJobId: () => resolvedJobId,
    startEnqueue: async () => {
      const enqueued = await enqueueEditFunnelUi(body);
      resolvedJobId = enqueued.jobId;
      return enqueued.jobId;
    },
  });
}
