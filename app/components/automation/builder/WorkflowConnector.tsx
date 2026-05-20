"use client";

import { motion } from "framer-motion";

export function WorkflowConnector() {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <motion.div
        className="h-6 w-px origin-top bg-gradient-to-b from-zinc-300 to-zinc-400"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
      <svg width="12" height="8" viewBox="0 0 12 8" className="text-zinc-400">
        <path
          d="M6 8L0 0h12L6 8z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}