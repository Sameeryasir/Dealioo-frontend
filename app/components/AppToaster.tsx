"use client";

import { Toaster } from "sonner";

/** Global toast host, funnel signup preview and other flows use `toast()` from `sonner`. */
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
            "rounded-xl border border-zinc-200/90 shadow-xl backdrop-blur-md",
        },
      }}
    />
  );
}
