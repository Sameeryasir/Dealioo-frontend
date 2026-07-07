"use client";

import { forwardRef, type ReactNode } from "react";

export const GuestChatScrollArea = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    className?: string;
    onScroll?: () => void;
  }
>(function GuestChatScrollArea({ children, className = "", onScroll }, ref) {
  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={`guest-chat-scrollbar min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  );
});

GuestChatScrollArea.displayName = "GuestChatScrollArea";
