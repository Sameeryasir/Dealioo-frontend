export const AUTH_BROADCAST_CHANNEL = "dealioo-auth";

export type AuthBroadcastMessage = {
  type: "session-changed";
  action: "marked" | "cleared";
  at: number;
};

let channel: BroadcastChannel | null | undefined;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (channel !== undefined) return channel;
  try {
    channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  } catch {
    channel = null;
  }
  return channel;
}

export function broadcastAuthSessionChanged(
  action: AuthBroadcastMessage["action"],
): void {
  const ch = getChannel();
  if (!ch) return;
  const message: AuthBroadcastMessage = {
    type: "session-changed",
    action,
    at: Date.now(),
  };
  try {
    ch.postMessage(message);
  } catch {
  }
}

export function subscribeAuthBroadcast(
  onMessage: (message: AuthBroadcastMessage) => void,
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<AuthBroadcastMessage>) => {
    const data = event.data;
    if (!data || data.type !== "session-changed") return;
    if (data.action !== "marked" && data.action !== "cleared") return;
    onMessage(data);
  };

  ch.addEventListener("message", handler);
  return () => {
    ch.removeEventListener("message", handler);
  };
}
