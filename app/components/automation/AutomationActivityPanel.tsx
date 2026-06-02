"use client";

import { Workflow } from "lucide-react";
import { RunProgressBanner } from "@/app/components/automation/RunProgressBanner";
import { PauseAutomationButton } from "@/app/components/shared/PauseAutomationButton";
import { RunAutomationButton } from "@/app/components/shared/RunAutomationButton";
import { useToggleAutomationActive } from "@/app/hooks/use-toggle-automation-active";
import { panelCardClass } from "@/app/lib/panel-styles";
import { useStartAutomationRun } from "@/app/hooks/use-start-automation-run";

export function AutomationActivityPanel({
  automationId,
  automationActive,
  showRunButton = true,
  showPauseButton = false,
  onRunStarted,
}: {
  automationId: number;
  automationActive?: boolean;
  showRunButton?: boolean;
  showPauseButton?: boolean;
  onRunStarted?: (executionId: number) => void;
}) {
  const { busy, activeRun, run } = useStartAutomationRun(
    automationId,
    automationActive,
  );
  const {
    busy: pauseBusy,
    pause,
    resume,
  } = useToggleAutomationActive(automationId);

  return (
    <div className="min-w-0 bg-zinc-50">
      <div className="border-b border-zinc-200/90 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Activity</h2>
            <p className="text-sm text-zinc-500">
              {showPauseButton
                ? "This flow runs on a schedule. Pause or resume it here; open the Runs tab for history."
                : showRunButton
                  ? "Start a run here. Open the Runs tab to see each batch and who was reached."
                  : "Open the Runs tab to see past runs."}
            </p>
          </div>
          {showPauseButton ? (
            <PauseAutomationButton
              busy={pauseBusy}
              isActive={automationActive !== false}
              onClick={() =>
                void (automationActive !== false ? pause() : resume())
              }
            />
          ) : showRunButton ? (
            <RunAutomationButton
              busy={busy}
              disabled={automationActive === false}
              onClick={() =>
                void run((result) => onRunStarted?.(result.executionId))
              }
            />
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {activeRun ? <RunProgressBanner status={activeRun} /> : null}

        <div className="flex items-center justify-center py-12">
          <div
            className={`max-w-sm px-6 py-10 text-center shadow-sm ${panelCardClass}`}
          >
            <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Workflow className="size-6" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-semibold text-zinc-900">
              Runs are on the Runs tab
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              After you run, progress appears here until emails finish sending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
