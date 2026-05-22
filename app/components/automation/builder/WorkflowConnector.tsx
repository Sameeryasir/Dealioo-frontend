"use client";

import { motion } from "framer-motion";

export function WorkflowConnector() {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden>
      <div className="relative flex flex-col items-center">
        <motion.div
          className="h-9 w-[2px] origin-top rounded-full bg-gradient-to-b from-violet-300 via-zinc-300/90 to-zinc-400/80"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.55)]"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0.75, 1, 0.75], scale: [0.92, 1.08, 0.92] }}
          transition={{
            delay: 0.15,
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      <motion.svg
        width="14"
        height="8"
        viewBox="0 0 14 9"
        className="-mt-px text-zinc-400/90"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.22 }}
      >
        <path d="M7 9L0.5 1h13L7 9z" fill="currentColor" />
      </motion.svg>
    </div>
  );
}