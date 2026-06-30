import { subscribeExecutionTerminal } from "@/app/lib/pusher-client";
import {
  isPusherConfigured,
  mapPusherPayloadToStatusDto,
  pusherExecutionChannel,
  type ExecutionTerminalPusherPayload,
} from "@/app/lib/pusher-execution";
import { getExecutionStatus } from "@/app/services/automation/execution-api";
import type { AutomationExecutionStatusDto } from "@/app/services/automation/types";

export const EXECUTION_COMPLETION_MAX_WAIT_MS = 15 * 60 * 1000;
const STATUS_POLL_INTERVAL_MS = 2000;

function isTerminalStatus(
  status: AutomationExecutionStatusDto,
): boolean {
  return (
    status.isTerminal ||
    status.status === "completed" ||
    status.status === "failed"
  );
}

async function pollExecutionStatus(
  executionId: number,
): Promise<AutomationExecutionStatusDto | null> {
  try {
    const status = await getExecutionStatus(executionId);
    return isTerminalStatus(status) ? status : null;
  } catch {
    return null;
  }
}

export async function waitForExecutionTerminal(
  executionId: number,
  initialStatus: AutomationExecutionStatusDto,
  onUpdate: (status: AutomationExecutionStatusDto) => void,
  options?: { maxWaitMs?: number },
): Promise<AutomationExecutionStatusDto> {
  const maxWaitMs = options?.maxWaitMs ?? EXECUTION_COMPLETION_MAX_WAIT_MS;
  const deadline = Date.now() + maxWaitMs;

  if (isTerminalStatus(initialStatus)) {
    return initialStatus;
  }

  if (!isPusherConfigured()) {
    console.warn(
      "[Automation Run] Pusher not configured, falling back to status polling.",
    );

    while (Date.now() < deadline) {
      const polled = await pollExecutionStatus(executionId);
      if (polled) {
        onUpdate(polled);
        return polled;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, STATUS_POLL_INTERVAL_MS),
      );
    }

    throw new Error(
      "Run is taking longer than expected. Check the Runs tab for the latest status.",
    );
  }

  console.log("[Automation Run] Listening for completion via Pusher (with status polling fallback):", {
    channel: pusherExecutionChannel(executionId),
    events: ["execution-completed", "execution-failed"],
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const finish = (status: AutomationExecutionStatusDto) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (pollTimer) clearInterval(pollTimer);
      cleanup();
      resolve(status);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (pollTimer) clearInterval(pollTimer);
      cleanup();
      reject(err);
    };

    const onPusherTerminal = (payload: ExecutionTerminalPusherPayload) => {
      const status = mapPusherPayloadToStatusDto(payload, initialStatus);
      onUpdate(status);
      finish(status);
    };

    const cleanup = subscribeExecutionTerminal(executionId, onPusherTerminal);

    pollTimer = setInterval(() => {
      if (settled) return;
      if (Date.now() >= deadline) return;

      void pollExecutionStatus(executionId).then((polled) => {
        if (!polled || settled) return;
        onUpdate(polled);
        finish(polled);
      });
    }, STATUS_POLL_INTERVAL_MS);

    const timeoutId = setTimeout(() => {
      fail(
        new Error(
          "Run is taking longer than expected. Check the Runs tab for the latest status.",
        ),
      );
    }, maxWaitMs);
  });
}
