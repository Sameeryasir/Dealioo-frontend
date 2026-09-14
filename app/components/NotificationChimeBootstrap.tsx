"use client";

import { installNotificationChimeUnlock } from "@/app/lib/play-notification-chime";
import { useEffect } from "react";

export function NotificationChimeBootstrap() {
  useEffect(() => {
    installNotificationChimeUnlock();
  }, []);

  return null;
}
