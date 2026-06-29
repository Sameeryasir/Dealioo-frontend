"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function GuestChatIconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  spinning = false,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  spinning?: boolean;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? "p-2" : "rounded-xl p-2.5"
      }`}
    >
      <Icon
        className={`${compact ? "size-3.5" : "size-4"} ${spinning ? "animate-spin" : ""}`}
        aria-hidden
      />
    </motion.button>
  );
}
