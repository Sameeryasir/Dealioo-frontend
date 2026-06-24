"use client";

import Pusher, { type Channel } from "pusher-js";
import {
  PUSHER_EXECUTION_EVENT,
  type ExecutionTerminalPusherPayload,
  isPusherConfigured,
  pusherAutomationChannel,
  pusherExecutionChannel,
} from "@/app/lib/pusher-execution";

let sharedClient: Pusher | null = null;
const channelRefCounts = new Map<string, number>();

const listSubscribedAutomationIds = new Set<number>();
let listTerminalHandler:
  | ((payload: ExecutionTerminalPusherPayload) => void)
  | null = null;

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
    });
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

  const handlerFactory = (eventName: string) => (raw: unknown) => {
    const payload = parseExecutionTerminalPayload(raw);
    if (!payload) {
      return;
    }
    onTerminal(payload);
  };

  const handlers = TERMINAL_EVENTS.map((eventName) => ({
    eventName,
    handler: handlerFactory(eventName),
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
