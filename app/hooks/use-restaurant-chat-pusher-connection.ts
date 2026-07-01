"use client";

import { useEffect, useState } from "react";
import {
  getPusherClient,
  getPusherConnectionStatus,
  subscribePusherConnectionStatus,
  type PusherConnectionStatus,
} from "@/app/lib/pusher-client";
import { isPusherConfigured } from "@/app/lib/pusher-chat";

export function useRestaurantChatPusherConnection(): PusherConnectionStatus {
  const [status, setStatus] = useState<PusherConnectionStatus>(() =>
    isPusherConfigured() ? getPusherConnectionStatus() : "offline",
  );

  useEffect(() => {
    if (!isPusherConfigured()) {
      console.warn("[Chat Pusher] Connection offline — env vars not set.");
      setStatus("offline");
      return;
    }

    getPusherClient();
    console.log("[Chat Pusher] Connection hook started", {
      status: getPusherConnectionStatus(),
    });

    return subscribePusherConnectionStatus((next) => {
      console.log("[Chat Pusher] Connection status changed", { status: next });
      setStatus(next);
    });
  }, []);

  return status;
}
