"use client";

import { forwardRef, type ReactNode } from "react";

export const GuestChatScrollArea = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    className?: string;
  }
>(function GuestChatScrollArea({ children, className = "" }, ref) {
  return (
    <div
      ref={ref}
      className={`guest-chat-scrollbar min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  );
});

GuestChatScrollArea.displayName = "GuestChatScrollArea";
