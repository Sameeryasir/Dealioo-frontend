"use client";

import Pusher, { type Channel } from "pusher-js";
import { getApiBaseUrl } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import {
  PUSHER_EXECUTION_EVENT,
  type ExecutionTerminalPusherPayload,
  isPusherConfigured,
  pusherAutomationChannel,
  pusherExecutionChannel,
} from "@/app/lib/pusher-execution";
import {
  PUSHER_CHAT_EVENT,
  parseChatMessagePusherPayload,
  pusherRestaurantChatChannel,
  type ChatMessagePusherPayload,
} from "@/app/lib/pusher-chat";

export type PusherConnectionStatus = "live" | "reconnecting" | "offline";

let sharedClient: Pusher | null = null;
const channelRefCounts = new Map<string, number>();

const listSubscribedAutomationIds = new Set<number>();
let listTerminalHandler:
  | ((payload: ExecutionTerminalPusherPayload) => void)
  | null = null;

let connectionStatus: PusherConnectionStatus = isPusherConfigured()
  ? "reconnecting"
  : "offline";
const connectionListeners = new Set<(status: PusherConnectionStatus) => void>();
const reconnectListeners = new Set<() => void>();
let connectionBindingsAttached = false;

function mapPusherState(state: string): PusherConnectionStatus {
  if (state === "connected") {
    return "live";
  }

  if (state === "connecting") {
    return "reconnecting";
  }

  return "offline";
}

function notifyConnectionStatus(status: PusherConnectionStatus) {
  connectionStatus = status;
  for (const listener of connectionListeners) {
    listener(status);
  }
}

function notifyReconnect() {
  for (const listener of reconnectListeners) {
    listener();
  }
}

function attachConnectionBindings(client: Pusher) {
  if (connectionBindingsAttached) {
    return;
  }

  connectionBindingsAttached = true;
  notifyConnectionStatus(mapPusherState(client.connection.state));

  client.connection.bind("state_change", (states: { previous: string; current: string }) => {
    const next = mapPusherState(states.current);
    notifyConnectionStatus(next);

    if (
      states.current === "connected" &&
      (states.previous === "disconnected" ||
        states.previous === "unavailable" ||
        states.previous === "failed")
    ) {
      notifyReconnect();
    }
  });
}

export function getPusherConnectionStatus(): PusherConnectionStatus {
  return connectionStatus;
}

export function subscribePusherConnectionStatus(
  listener: (status: PusherConnectionStatus) => void,
): () => void {
  connectionListeners.add(listener);
  listener(connectionStatus);

  return () => {
    connectionListeners.delete(listener);
  };
}

export function subscribePusherReconnect(listener: () => void): () => void {
  reconnectListeners.add(listener);
  return () => {
    reconnectListeners.delete(listener);
  };
}

export function parseExecutionTerminalPayload(
  data: unknown,
): ExecutionTerminalPusherPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const executionId = Number(row.executionId);
  const automationId = Number(row.automationId);
  if (!Number.isFinite(executionId) || executionId < 1) return null;
  if (!Number.isFinite(automationId) || automationId < 1) return null;

  const status = row.status;
  if (status !== "completed" && status !== "failed") return null;

  const finishedAtRaw = row.finishedAt ?? row.completedAt;
  if (typeof finishedAtRaw !== "string" || !finishedAtRaw.trim()) {
    return null;
  }

  return {
    executionId,
    automationId,
    status,
    isTerminal: true,
    totalRecipients: Number(row.totalRecipients) || 0,
    emailsSent: Number(row.emailsSent ?? row.emailsSentCount) || 0,
    progressPercent: Number(row.progressPercent) || 0,
    queueJobId:
      row.queueJobId == null ? null : String(row.queueJobId),
    lastError: row.lastError == null ? null : String(row.lastError),
    finishedAt: finishedAtRaw,
    stepType:
      typeof row.stepType === "string" && row.stepType.trim()
        ? row.stepType.trim()
        : null,
  };
}

export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined" || !isPusherConfigured()) {
    return null;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY!.trim();
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!.trim();

  if (!sharedClient) {
    sharedClient = new Pusher(key, {
      cluster,
      forceTLS: true,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          if (!channel.name.startsWith("private-")) {
            callback(new Error("Unsupported channel type."), null);
            return;
          }

          void authenticatedFetch(`${getApiBaseUrl()}/pusher/auth`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error("Could not authorize realtime channel.");
              }

              const auth = (await response.json()) as {
                auth: string;
                channel_data?: string;
              };
              callback(null, auth);
            })
            .catch((error: unknown) => {
              callback(
                error instanceof Error ? error : new Error("Pusher auth failed."),
                null,
              );
            });
        },
      }),
    });

    attachConnectionBindings(sharedClient);
  }

  return sharedClient;
}

function retainChannel(client: Pusher, channelName: string): Channel {
  const existing = client.channel(channelName);
  if (existing) {
    channelRefCounts.set(
      channelName,
      (channelRefCounts.get(channelName) ?? 0) + 1,
    );
    return existing;
  }

  channelRefCounts.set(channelName, 1);
  return client.subscribe(channelName);
}

function releaseChannel(client: Pusher, channelName: string) {
  const next = (channelRefCounts.get(channelName) ?? 1) - 1;
  if (next <= 0) {
    channelRefCounts.delete(channelName);
    client.unsubscribe(channelName);
  } else {
    channelRefCounts.set(channelName, next);
  }
}

const TERMINAL_EVENTS = [
  PUSHER_EXECUTION_EVENT.COMPLETED,
  PUSHER_EXECUTION_EVENT.FAILED,
] as const;

function subscribeChannelTerminal(
  channelName: string,
  onTerminal: (payload: ExecutionTerminalPusherPayload) => void,
): () => void {
  const client = getPusherClient();
  if (!client) {
    return () => {};
  }

  const channel = retainChannel(client, channelName);

  const handlerFactory = () => (raw: unknown) => {
    const payload = parseExecutionTerminalPayload(raw);
    if (!payload) {
      return;
    }
    onTerminal(payload);
  };

  const handlers = TERMINAL_EVENTS.map((eventName) => ({
    eventName,
    handler: handlerFactory(),
  }));

  const bindHandlers = () => {
    channel.unbind("pusher:subscription_succeeded", bindHandlers);
    for (const { eventName, handler } of handlers) {
      channel.bind(eventName, handler);
    }
  };

  if (channel.subscribed) {
    bindHandlers();
  } else {
    channel.bind("pusher:subscription_succeeded", bindHandlers);
  }

  return () => {
    for (const { eventName, handler } of handlers) {
      channel.unbind(eventName, handler);
    }
    channel.unbind("pusher:subscription_succeeded", bindHandlers);
    releaseChannel(client, channelName);
  };
}

export function subscribeExecutionTerminal(
  executionId: number,
  onTerminal: (payload: ExecutionTerminalPusherPayload) => void,
): () => void {
  return subscribeChannelTerminal(pusherExecutionChannel(executionId), onTerminal);
}

export function subscribeAutomationTerminal(
  automationId: number,
  onTerminal: (payload: ExecutionTerminalPusherPayload) => void,
): () => void {
  return subscribeChannelTerminal(
    pusherAutomationChannel(automationId),
    onTerminal,
  );
}

function subscribeChannelEvent<T>(
  channelName: string,
  eventName: string,
  onEvent: (payload: T) => void,
  parsePayload: (raw: unknown) => T | null,
): () => void {
  const client = getPusherClient();
  if (!client) {
    return () => {};
  }

  const channel = retainChannel(client, channelName);

  const handler = (raw: unknown) => {
    const payload = parsePayload(raw);
    if (!payload) {
      return;
    }
    onEvent(payload);
  };

  const bindHandler = () => {
    channel.unbind("pusher:subscription_succeeded", bindHandler);
    channel.bind(eventName, handler);
  };

  if (channel.subscribed) {
    bindHandler();
  } else {
    channel.bind("pusher:subscription_succeeded", bindHandler);
  }

  return () => {
    channel.unbind(eventName, handler);
    channel.unbind("pusher:subscription_succeeded", bindHandler);
    releaseChannel(client, channelName);
  };
}

export function subscribeRestaurantChatMessages(
  restaurantId: number,
  onMessage: (payload: ChatMessagePusherPayload) => void,
): () => void {
  return subscribeChannelEvent(
    pusherRestaurantChatChannel(restaurantId),
    PUSHER_CHAT_EVENT.MESSAGE_SENT,
    onMessage,
    parseChatMessagePusherPayload,
  );
}

/**
 * Subscribes each automation channel once for the session (list view).
 * Stays subscribed after leaving the Automations tab.
 */
export function ensureAutomationListSubscriptions(
  automationIds: number[],
  onTerminal: (payload: ExecutionTerminalPusherPayload) => void,
): void {
  listTerminalHandler = onTerminal;

  if (!getPusherClient()) {
    return;
  }

  const unique = [...new Set(automationIds)].filter((id) => id >= 1);
  for (const automationId of unique) {
    if (listSubscribedAutomationIds.has(automationId)) {
      continue;
    }
    listSubscribedAutomationIds.add(automationId);
    subscribeChannelTerminal(pusherAutomationChannel(automationId), (payload) => {
      listTerminalHandler?.(payload);
    });
  }
}
