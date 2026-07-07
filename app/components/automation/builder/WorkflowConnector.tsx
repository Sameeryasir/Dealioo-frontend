"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export function WorkflowConnector() {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden>
      <div className="h-8 w-px bg-gradient-to-b from-zinc-200 to-zinc-300" />
      <div className="size-2.5 rounded-full border-2 border-white bg-zinc-400 shadow-sm" />
    </div>
  );
}

export function TriggerFlowConnector() {
  return (
    <div className="flex flex-col items-center py-3" aria-hidden>
      <div className="h-6 w-px bg-gradient-to-b from-zinc-200 to-zinc-300" />
      <div className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] ring-1 ring-zinc-100">
        <Plus className="size-4 text-sky-600" strokeWidth={2.5} />
      </div>
      <div className="mt-2 h-6 w-px bg-gradient-to-b from-zinc-300 to-zinc-400" />
      <motion.div
        className="size-2.5 rounded-full bg-zinc-900 shadow-sm"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}

export function FlowSplitConnector({ wide = false }: { wide?: boolean }) {
  const branchInset = wide ? "inset-x-[10%] lg:inset-x-[6%]" : "inset-x-4";
  const dotInset = wide ? "px-[10%] lg:px-[6%]" : "px-[18%]";

  return (
    <div className="flex w-full flex-col items-center py-3" aria-hidden>
      <div className="h-6 w-px bg-zinc-300" />
      <div className={`relative flex w-full items-center justify-center ${wide ? "px-[10%] lg:px-[6%]" : "px-4"}`}>
        <div className={`absolute top-1/2 h-px -translate-y-1/2 bg-zinc-300 ${branchInset}`} />
        <div className="relative flex w-full justify-between">
          {[0, 1, 2].map((slot) => (
            <span
              key={slot}
              className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-sky-600 shadow-sm"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
          ))}
        </div>
      </div>
      <div className={`relative mt-3 flex w-full justify-between ${dotInset}`}>
        <div className="flex flex-col items-center">
          <div className="h-4 w-px bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-900" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-4 w-px bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-900" />
        </div>
      </div>
    </div>
  );
}

export function PrepaidVisitSplitConnector({ wide = false }: { wide?: boolean }) {
  const branchInset = wide ? "inset-x-[10%] lg:inset-x-[6%]" : "inset-x-4";
  const dotInset = wide ? "px-[10%] lg:px-[6%]" : "px-[18%]";

  return (
    <div className="flex w-full flex-col items-center py-3" aria-hidden>
      <div className="h-6 w-px bg-zinc-300" />
      <div className={`relative flex w-full items-center justify-center ${wide ? "px-[10%] lg:px-[6%]" : "px-4"}`}>
        <div className={`absolute top-1/2 h-px -translate-y-1/2 bg-zinc-300 ${branchInset}`} />
        <div className="relative flex w-full justify-between">
          {[0, 1].map((slot) => (
            <span
              key={slot}
              className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-sky-600 shadow-sm"
            >
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
          ))}
        </div>
      </div>
      <div className={`relative mt-2 flex w-full justify-between px-6 text-[0.65rem] font-bold uppercase tracking-wide ${wide ? "px-[12%] lg:px-[8%]" : ""}`}>
        <span className="text-amber-700">Not visited</span>
        <span className="text-emerald-700">Visited</span>
      </div>
      <div className={`relative mt-2 flex w-full justify-between ${dotInset}`}>
        <div className="flex flex-col items-center">
          <div className="h-4 w-px bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-amber-500" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-4 w-px bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}
