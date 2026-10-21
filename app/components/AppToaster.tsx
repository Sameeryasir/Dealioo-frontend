"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      offset={{ top: "1rem" }}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-zinc-200/90 shadow-xl backdrop-blur-md !items-start gap-3",
          content: "min-w-0 flex-1",
          title: "leading-snug",
          description: "leading-snug break-words !whitespace-normal",
          actionButton:
            "!shrink-0 !self-center !bg-zinc-900 !text-white hover:!bg-zinc-800 !rounded-md !h-8 !px-2.5 !text-xs",
          closeButton:
            "!left-auto !right-0 !top-0 !translate-x-1/3 !-translate-y-1/3 border border-current/20 bg-white",
        },
      }}
    />
  );
}
