"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      visibleToasts={4}
      offset={{ top: "1rem" }}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-zinc-200/90 shadow-xl backdrop-blur-md !items-start gap-3 !max-w-[min(28rem,calc(100vw-1.5rem))] !py-3.5 !px-4",
          content: "min-w-0 flex-1 pr-2",
          title:
            "!text-[0.9375rem] !font-semibold !leading-snug !text-balance break-words",
          description:
            "!text-[0.8125rem] !leading-snug !text-pretty break-words !whitespace-normal !opacity-95",
          actionButton:
            "!shrink-0 !self-center !bg-zinc-900 !text-white hover:!bg-zinc-800 !rounded-md !h-8 !px-2.5 !text-xs",
          closeButton:
            "!left-auto !right-0 !top-0 !translate-x-1/3 !-translate-y-1/3 border border-current/20 bg-white",
        },
      }}
    />
  );
}
