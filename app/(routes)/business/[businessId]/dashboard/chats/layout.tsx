"use client";

import type { ReactNode } from "react";
import { useGuestChatsScrollLock } from "@/app/components/business/guest-chats/useGuestChatsScrollLock";

export default function BusinessChatsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  useGuestChatsScrollLock();

  return (
    <div className="flex h-full max-h-full min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
