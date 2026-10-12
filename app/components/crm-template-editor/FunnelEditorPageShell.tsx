"use client";

import type { ReactNode } from "react";

export function FunnelEditorPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="funnel-editor-host funnel-editor-enter flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
