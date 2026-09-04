"use client";

import { motion } from "framer-motion";
import { Workflow } from "lucide-react";

export function GuestChatAutomationBadge({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#e8f2ff] font-semibold text-[#1877f2] ring-1 ring-[#dbeafe] ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
    >
      <Workflow className={compact ? "size-3 shrink-0" : "size-3.5 shrink-0"} aria-hidden />
      <span className="truncate">{label}</span>
    </motion.span>
  );
}
