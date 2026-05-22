"use client";

import { useEffect, useRef } from "react";
import { subscribeExecutionTerminal } from "@/app/lib/pusher-client";

export function useExecutionPusher(
  executionId: number | null,
  onExecutionTerminal: () => void,
) {
  const onTerminalRef = useRef(onExecutionTerminal);
  onTerminalRef.current = onExecutionTerminal;

  useEffect(() => {
    if (executionId == null) return;
    return subscribeExecutionTerminal(executionId, () => {
      onTerminalRef.current();
    });
  }, [executionId]);
}
