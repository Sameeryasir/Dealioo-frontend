"use client";

import { motion } from "framer-motion";

export function WorkflowConnector() {
  return (
    <div className="flex flex-col items-center py-0.5" aria-hidden>
      <motion.div
        className="h-7 w-0.5 origin-top rounded-full bg-gradient-to-b from-violet-200 via-zinc-300 to-zinc-400"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
      <svg
        width="14"
        height="9"
        viewBox="0 0 14 9"
        className="-mt-px text-zinc-400/90"
      >
        <path d="M7 9L0.5 1h13L7 9z" fill="currentColor" />
      </svg>
    </div>
  );
}