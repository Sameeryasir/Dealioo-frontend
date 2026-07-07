"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  MessageSquare,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { guestChatPanelReveal } from "./guest-chats-motion";

const ICON_STROKE = 2;

function GuestChatEmptyStateShell({
  icon: Icon,
  title,
  description,
  action,
  accent = "blue",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  accent?: "blue" | "violet" | "zinc";
}) {
  const accentClass =
    accent === "violet"
      ? "from-violet-500 to-indigo-600 shadow-violet-500/20 ring-violet-100"
      : accent === "zinc"
        ? "from-zinc-500 to-zinc-600 shadow-zinc-500/15 ring-zinc-100"
        : "from-blue-500 to-blue-600 shadow-blue-500/20 ring-blue-100";

  return (
    <motion.div
      variants={guestChatPanelReveal}
      initial="hidden"
      animate="show"
      className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-8 py-16 text-center"
    >
      <span
        className={`relative flex size-20 items-center justify-center rounded-[1.35rem] bg-gradient-to-br text-white shadow-xl ring-8 ${accentClass}`}
      >
        <Icon className="size-9" aria-hidden strokeWidth={ICON_STROKE} />
        <span className="absolute -right-1 -top-1 size-4 rounded-full bg-white/90 shadow-sm" aria-hidden />
      </span>
      <h3 className="mt-6 text-xl font-bold tracking-tight text-zinc-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-zinc-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}

export function GuestChatSelectConversationEmptyState({
  hasGuests = false,
}: {
  hasGuests?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-8 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <MessageSquare className="size-8" aria-hidden strokeWidth={ICON_STROKE} />
      </span>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-zinc-900">
        {hasGuests
          ? "Select a guest to view their messages"
          : "Select a guest to open their thread"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-zinc-500">
        {hasGuests
          ? "Choose a guest from the list on the left to see emails and texts sent by your automations."
          : "Every email, text, and automation step appears here in chronological order."}
      </p>
      <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm">
        <Users className="size-4 text-blue-500" aria-hidden />
        {hasGuests ? "Click a guest in the inbox" : "Choose a guest from the inbox"}
      </p>
    </div>
  );
}

export function GuestChatNoThreadsEmptyState() {
  return (
    <GuestChatEmptyStateShell
      icon={Inbox}
      accent="violet"
      title="No chats yet"
      description="When automations send emails or texts, each guest thread will appear in your inbox."
      action={
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
          <Sparkles className="size-4" aria-hidden />
          Threads appear after the first send
        </span>
      }
    />
  );
}

export function GuestChatNoSearchResultsEmptyState() {
  return (
    <GuestChatEmptyStateShell
      icon={Search}
      accent="zinc"
      title="No search results"
      description="Try a different guest name, email, automation, or message keyword."
    />
  );
}

export function GuestChatNoMessagesEmptyState() {
  return (
    <GuestChatEmptyStateShell
      icon={Sparkles}
      accent="violet"
      title="No messages yet"
      description="Emails and texts from automations will appear here once they are sent to this guest."
    />
  );
}

export function GuestChatErrorEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <GuestChatEmptyStateShell
      icon={MessageSquare}
      accent="zinc"
      title={title}
      description={description}
    />
  );
}
