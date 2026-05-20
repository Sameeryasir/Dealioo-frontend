"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AutomationApiError } from "@/app/services/automation/automation-fetch";
import { startExecution } from "@/app/services/automation/execution-api";

export function useStartAutomationRun(
  automationId: number,
  automationActive?: boolean,
) {
  const [starting, setStarting] = useState(false);

  const run = useCallback(
    async (onStarted?: (executionId: number) => void) => {
      if (automationActive === false) {
        toast.error("Automation must be active before starting a run.");
        return;
      }

      setStarting(true);
      try {
        const execution = await startExecution(automationId);
        toast.success(
          "Run started. Emails are sending in the background — refresh to see progress.",
        );
        onStarted?.(execution.id);
      } catch (err) {
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
        setStarting(false);
      }
    },
    [automationId, automationActive],
  );

  return { starting, run };
}
