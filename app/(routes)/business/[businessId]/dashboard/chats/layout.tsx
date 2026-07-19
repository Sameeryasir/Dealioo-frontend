"use client";

import type { ReactNode } from "react";
import { useGuestChatsScrollLock } from "@/app/components/business/guest-chats/useGuestChatsScrollLock";

export default function BusinessChatsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  useGuestChatsScrollLock();

  return <>{children}</>;
}
