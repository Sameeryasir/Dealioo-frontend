"use client";

import { useEffect, useState } from "react";
import {
  getPusherClient,
  getPusherConnectionStatus,
  subscribePusherConnectionStatus,
  type PusherConnectionStatus,
} from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-chat";

export function useBusinessChatPusherConnection(): PusherConnectionStatus {
  const [status, setStatus] = useState<PusherConnectionStatus>(() =>
    isPusherConfigured() ? getPusherConnectionStatus() : "offline",
  );

  useEffect(() => {
    if (!isPusherConfigured()) {
      setStatus("offline");
      return;
    }

    getPusherClient();
    return subscribePusherConnectionStatus((next) => {
      setStatus(next);
    });
  }, []);

  return status;
}
