"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeExecutionStatusForDisplay } from "@/app/components/automation/execution-status-ui";
import { waitForExecutionTerminal } from "@/app/lib/wait-for-execution-terminal";
import { AutomationApiError } from "@/app/services/automation/automation-fetch";
import { startExecution } from "@/app/services/automation/execution-api";
import type { AutomationExecutionStatusDto } from "@/app/services/automation/types";

const TERMINAL_BANNER_MS = 2500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useStartAutomationRun(
  automationId: number,
  automationActive?: boolean,
) {
  const [starting, setStarting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [activeRun, setActiveRun] =
    useState<AutomationExecutionStatusDto | null>(null);
  const pollGenerationRef = useRef(0);

  type RunCallbacks = {
    onStarted?: (status: AutomationExecutionStatusDto) => void;
    onFinished?: (status: AutomationExecutionStatusDto) => void;
  };

  const run = useCallback(
    async (callbacks?: RunCallbacks | ((result: AutomationExecutionStatusDto) => void)) => {
      const { onStarted, onFinished } =
        typeof callbacks === "function"
          ? { onFinished: callbacks }
          : (callbacks ?? {});
      if (automationActive === false) {
        toast.error("Automation must be active before starting a run.");
        return;
      }

      const generation = ++pollGenerationRef.current;
      setStarting(true);
      setActiveRun(null);

      try {
        console.log("[Automation Run] Run button tapped, starting execution", {
          automationId,
        });

        const { status: initial } = await startExecution(automationId);
        if (generation !== pollGenerationRef.current) return;

        console.log(
          "[Automation Run] Execution queued, waiting for completion (Pusher if configured, no status polling API)",
          { executionId: initial.executionId },
        );

        setActiveRun(initial);
        setStarting(false);
        setPolling(true);
        onStarted?.(initial);

        const final = await waitForExecutionTerminal(
          initial.executionId,
          initial,
          (update) => {
            if (generation === pollGenerationRef.current) {
              setActiveRun(update);
            }
          },
        );

        if (generation !== pollGenerationRef.current) return;

        const displayFinal = normalizeExecutionStatusForDisplay(final);
        setActiveRun(displayFinal);
        setPolling(false);

        console.log("[Automation Run] Execution finished", {
          executionId: final.executionId,
          status: final.status,
          emailsSent: displayFinal.emailsSent,
          totalRecipients: displayFinal.totalRecipients,
        });

        if (final.status === "completed") {
          const sent = displayFinal.emailsSent || displayFinal.totalRecipients;
          const total = displayFinal.totalRecipients;
          toast.success(
            `Run completed, ${sent} of ${total} email${total === 1 ? "" : "s"} sent.`,
          );
        } else if (final.status === "failed") {
          toast.error(final.lastError ?? "Run failed.");
        }

        onFinished?.(final);

        if (final.status === "completed" || final.status === "failed") {
          await delay(TERMINAL_BANNER_MS);
        }
      } catch (err) {
        if (generation !== pollGenerationRef.current) return;

        if (err instanceof AutomationApiError) {
          if (err.status === 403) {
            toast.error("Admin permission required.");
          } else if (err.status === 409) {
            toast.error("A run is already in progress for this automation.");
          } else {
            toast.error(err.message);
          }
        } else {
          toast.error(
            err instanceof Error ? err.message : "Could not start run.",
          );
        }
      } finally {
        if (generation === pollGenerationRef.current) {
          setStarting(false);
          setPolling(false);
          setActiveRun(null);
        }
      }
    },
    [automationId, automationActive],
  );

  const busy = starting || polling || activeRun != null;

  return { starting, polling, busy, activeRun, run };
}
