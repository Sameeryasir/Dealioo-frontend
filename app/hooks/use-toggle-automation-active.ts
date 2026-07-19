"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiError } from "@/app/lib/toast-api-error";
import { updateAutomation } from "@/app/services/automation/automation-api";
import { syncAutomationQueryCache } from "@/app/services/automation/automation-query-cache";

export function useToggleAutomationActive(automationId: number) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const setActive = useCallback(
    async (isActive: boolean) => {
      setBusy(true);
      try {
        const updated = await updateAutomation(
          automationId,
          isActive
            ? { isActive: true, published: true }
            : { isActive: false, published: false },
        );
        syncAutomationQueryCache(queryClient, updated);
        toast.success(
          isActive
            ? "Automation resumed. Sending now, then on the schedule."
            : "Automation paused and unpublished. Scheduled runs are stopped.",
        );
      } catch (err) {
        toastApiError(
          err,
          isActive ? "Could not resume automation." : "Could not pause automation.",
        );
      } finally {
        setBusy(false);
      }
    },
    [automationId, queryClient],
  );

  const pause = useCallback(() => setActive(false), [setActive]);
  const resume = useCallback(() => setActive(true), [setActive]);

  return { busy, pause, resume };
}
