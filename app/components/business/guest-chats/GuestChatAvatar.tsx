"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { guestAvatarSidebarClass, guestInitials } from "./guest-chats-utils";
import type { ConversationMessageKind } from "@/app/services/chat/get-business-conversation";

const AVATAR_TONES = [
  "#1877f2",
  "#0f766e",
  "#7c3aed",
  "#c2410c",
  "#be123c",
  "#0369a1",
] as const;

function toneForCustomer(customerId: number): string {
  const index = Math.abs(customerId) % AVATAR_TONES.length;
  return AVATAR_TONES[index] ?? AVATAR_TONES[0];
}

function buildInitialsAvatarDataUrl(initials: string, background: string): string {
  const safe = initials.slice(0, 2).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="64" fill="${background}"/>
  <text x="64" y="64" dy="0.35em" text-anchor="middle" fill="#ffffff" font-family="system-ui,Segoe UI,sans-serif" font-size="52" font-weight="700">${safe}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function GuestChatAvatar({
  name,
  email,
  customerId,
  channel,
  avatarUrl,
  size = "md",
  animated = false,
}: {
  name: string | null;
  email: string | null;
  customerId: number;
  channel?: ConversationMessageKind | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = guestInitials({
    customerId,
    customerName: name,
    customerEmail: email,
  });
  const sizeClass =
    size === "lg"
      ? "size-14 text-base"
      : size === "sm"
        ? "size-10 text-xs"
        : "size-11 text-sm";

  const generatedUrl = useMemo(
    () => buildInitialsAvatarDataUrl(initials, toneForCustomer(customerId)),
    [customerId, initials],
  );

  const photo = avatarUrl?.trim() && !imageFailed ? avatarUrl.trim() : generatedUrl;
  const className = `relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white ring-2 ${sizeClass} ${guestAvatarSidebarClass(customerId)}`;
  const label = name?.trim() || email?.trim() || "Guest";

  const content = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt=""
      className="size-full object-cover"
      referrerPolicy="no-referrer"
      onError={() => {
        if (avatarUrl?.trim() && !imageFailed) {
          setImageFailed(true);
        }
      }}
    />
  );

  if (animated) {
    return (
      <motion.span
        className={className}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28 }}
        whileHover={{ scale: 1.04 }}
        aria-label={label}
        title={label}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span className={className} aria-label={label} title={label}>
      {content}
    </span>
  );
}
