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
const STATUS_POLL_INTERVAL_START_MS = 2_000;
const STATUS_POLL_INTERVAL_MAX_MS = 15_000;

function isTerminalStatus(status: AutomationExecutionStatusDto): boolean {
  return (
    status.isTerminal ||
    status.status === "completed" ||
    status.status === "failed" ||
    status.status === "cancelled" ||
    status.status === "timed_out"
  );
}

function nextPollDelayMs(current: number): number {
  return Math.min(STATUS_POLL_INTERVAL_MAX_MS, Math.max(STATUS_POLL_INTERVAL_START_MS, current * 1.6));
}

async function fetchExecutionStatus(
  executionId: number,
): Promise<AutomationExecutionStatusDto | null> {
  try {
    return await getExecutionStatus(executionId);
  } catch {
    return null;
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitWhileTabHidden(): Promise<void> {
  if (typeof document === "undefined" || document.visibilityState === "visible") {
    return;
  }
  await new Promise<void>((resolve) => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        document.removeEventListener("visibilitychange", onVisible);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
  });
}

async function pollUntilTerminal(
  executionId: number,
  initialStatus: AutomationExecutionStatusDto,
  onUpdate: (status: AutomationExecutionStatusDto) => void,
  deadline: number,
): Promise<AutomationExecutionStatusDto> {
  let delayMs = STATUS_POLL_INTERVAL_START_MS;
  let latest = initialStatus;

  while (Date.now() < deadline) {
    await waitWhileTabHidden();
    if (Date.now() >= deadline) break;

    await waitMs(delayMs);
    await waitWhileTabHidden();
    if (Date.now() >= deadline) break;

    const polled = await fetchExecutionStatus(executionId);
    if (!polled) {
      delayMs = nextPollDelayMs(delayMs);
      continue;
    }

    latest = polled;
    onUpdate(polled);
    if (isTerminalStatus(polled)) {
      return polled;
    }
    delayMs = nextPollDelayMs(delayMs);
  }

  throw new Error(
    "Run is taking longer than expected. Check the Runs tab for the latest status.",
  );
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
      "[Automation Run] Pusher not configured, using adaptive status polling.",
    );
    return pollUntilTerminal(executionId, initialStatus, onUpdate, deadline);
  }

  console.log("[Automation Run] Listening for completion via Pusher (with status polling fallback):", {
    channel: pusherExecutionChannel(executionId),
    events: ["execution-completed", "execution-failed"],
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let pollDelayMs = STATUS_POLL_INTERVAL_START_MS;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const clearPoll = () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const finish = (status: AutomationExecutionStatusDto) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      clearPoll();
      cleanup();
      resolve(status);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      clearPoll();
      cleanup();
      reject(err);
    };

    const onPusherTerminal = (payload: ExecutionTerminalPusherPayload) => {
      const status = mapPusherPayloadToStatusDto(payload, initialStatus);
      onUpdate(status);
      finish(status);
    };

    const cleanup = subscribeExecutionTerminal(executionId, onPusherTerminal);

    const schedulePoll = () => {
      clearPoll();
      pollTimer = setTimeout(() => {
        void (async () => {
          if (settled) return;
          if (typeof document !== "undefined" && document.visibilityState !== "visible") {
            schedulePoll();
            return;
          }
          if (Date.now() >= deadline) return;

          const polled = await fetchExecutionStatus(executionId);
          if (settled) return;
          if (polled) {
            onUpdate(polled);
            if (isTerminalStatus(polled)) {
              finish(polled);
              return;
            }
          }
          pollDelayMs = nextPollDelayMs(pollDelayMs);
          schedulePoll();
        })();
      }, pollDelayMs);
    };

    schedulePoll();

    const timeoutId = setTimeout(() => {
      fail(
        new Error(
          "Run is taking longer than expected. Check the Runs tab for the latest status.",
        ),
      );
    }, maxWaitMs);
  });
}
