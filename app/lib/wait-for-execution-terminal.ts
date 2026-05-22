import { subscribeExecutionTerminal } from "@/app/lib/pusher-client";
import {
  isPusherConfigured,
  mapPusherPayloadToStatusDto,
  type ExecutionTerminalPusherPayload,
} from "@/app/lib/pusher-execution";
import type { AutomationExecutionStatusDto } from "@/app/services/automation/types";

export const EXECUTION_COMPLETION_MAX_WAIT_MS = 15 * 60 * 1000;

export async function waitForExecutionTerminal(
  executionId: number,
  initialStatus: AutomationExecutionStatusDto,
  onUpdate: (status: AutomationExecutionStatusDto) => void,
  options?: { maxWaitMs?: number },
): Promise<AutomationExecutionStatusDto> {
  if (!isPusherConfigured()) {
    return initialStatus;
  }

  const maxWaitMs = options?.maxWaitMs ?? EXECUTION_COMPLETION_MAX_WAIT_MS;

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (status: AutomationExecutionStatusDto) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      cleanup();
      resolve(status);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      cleanup();
      reject(err);
    };

    const onPusherTerminal = (payload: ExecutionTerminalPusherPayload) => {
      const status = mapPusherPayloadToStatusDto(payload, initialStatus);
      onUpdate(status);
      finish(status);
    };

    const cleanup = subscribeExecutionTerminal(executionId, onPusherTerminal);

    const timeoutId = setTimeout(() => {
      fail(
        new Error(
          "Run is taking longer than expected. Check the Runs tab for the latest status.",
        ),
      );
    }, maxWaitMs);
  });
}
