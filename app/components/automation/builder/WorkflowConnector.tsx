"use client";

import { ChevronDown, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function WorkflowConnector() {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <div className="h-5 w-0.5 rounded-full bg-zinc-300" />
      <ChevronDown
        className="-mt-0.5 size-3.5 text-zinc-400"
        strokeWidth={2.5}
        aria-hidden
      />
    </div>
  );
}

export function BranchTraceLine() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 z-0 flex w-0 -translate-x-1/2 justify-center"
      aria-hidden
    >
      <div className="h-full w-px bg-zinc-300/90" />
    </div>
  );
}

export function TriggerFlowConnector() {
  return (
    <div className="flex flex-col items-center py-3" aria-hidden>
      <div className="h-5 w-0.5 rounded-full bg-zinc-300" />
      <div className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] ring-1 ring-zinc-100">
        <Plus className="size-4 text-sky-600" strokeWidth={2.5} />
      </div>
      <div className="mt-1.5 h-5 w-0.5 rounded-full bg-zinc-300" />
      <ChevronDown
        className="-mt-0.5 size-3.5 text-zinc-400"
        strokeWidth={2.5}
        aria-hidden
      />
    </div>
  );
}

export function FlowSplitStem({
  isFirst,
  isLast,
  gapPx,
}: {
  isFirst: boolean;
  isLast: boolean;
  gapPx: number;
}) {
  const halfGap = gapPx / 2;

  return (
    <div className="relative mb-2 flex w-full flex-col items-center" aria-hidden>
      <div className="relative flex h-8 w-full items-center justify-center">
        {!isFirst ? (
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-zinc-400/80"
            style={{ left: -halfGap, right: "50%" }}
          />
        ) : null}
        {!isLast ? (
          <div
            className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-zinc-400/80"
            style={{ left: "50%", right: -halfGap }}
          />
        ) : null}
        <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-sky-600 shadow-sm sm:size-8">
          <Plus className="size-3.5 sm:size-4" strokeWidth={2.5} />
        </span>
      </div>
      <div className="h-4 w-0.5 rounded-full bg-zinc-400/80" />
      <ChevronDown
        className="-mt-0.5 size-3.5 text-zinc-400"
        strokeWidth={2.5}
        aria-hidden
      />
    </div>
  );
}

export function FlowSplitTrunk() {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <div className="h-8 w-0.5 rounded-full bg-zinc-400/80" />
    </div>
  );
}

export function FlowSplitConnector({
  wide = false,
  branchCount = 2,
}: {
  wide?: boolean;
  branchCount?: number;
}) {
  const slots = Math.max(2, Math.min(branchCount, 9));
  const pad = wide ? "px-[4%] lg:px-[2%]" : "px-4";

  return (
    <div className="flex w-full flex-col items-center py-3" aria-hidden>
      <FlowSplitTrunk />
      <div className={`relative mt-0 flex w-full ${pad}`}>
        {Array.from({ length: slots }, (_, slot) => (
          <div key={slot} className="flex min-w-0 flex-1 flex-col items-center">
            <FlowSplitStem
              isFirst={slot === 0}
              isLast={slot === slots - 1}
              gapPx={0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PrepaidVisitSplitConnector({ wide = false }: { wide?: boolean }) {
  const branchInset = wide ? "inset-x-[10%] lg:inset-x-[6%]" : "inset-x-4";
  const dotInset = wide ? "px-[10%] lg:px-[6%]" : "px-[18%]";

  return (
    <div className="flex w-full flex-col items-center py-3" aria-hidden>
      <div className="h-6 w-0.5 rounded-full bg-zinc-300" />
      <div
        className={`relative flex w-full items-center justify-center ${wide ? "px-[10%] lg:px-[6%]" : "px-4"}`}
      >
        <div
          className={`absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-zinc-300 ${branchInset}`}
        />
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
      <div
        className={`relative mt-2 flex w-full justify-between px-6 text-[0.65rem] font-bold uppercase tracking-wide ${wide ? "px-[12%] lg:px-[8%]" : ""}`}
      >
        <span className="text-amber-700">Not visited</span>
        <span className="text-emerald-700">Visited</span>
      </div>
      <div className={`relative mt-2 flex w-full justify-between ${dotInset}`}>
        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 rounded-full bg-amber-400/80" />
          <ChevronDown className="size-3.5 text-amber-500" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-4 w-0.5 rounded-full bg-emerald-400/80" />
          <ChevronDown className="size-3.5 text-emerald-500" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export function FlowParallelSplitFork({
  branches,
  wide = false,
  selected = false,
  onSelect,
}: {
  branches: readonly { id: string; title: string }[];
  wide?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const branchCount = Math.max(
    2,
    branches.length > 0 ? branches.length : 2,
  );
  const branchInset =
    branchCount <= 2
      ? wide
        ? "inset-x-[10%] lg:inset-x-[6%]"
        : "inset-x-[12%] sm:inset-x-[10%]"
      : wide
        ? "inset-x-[4%]"
        : "inset-x-[4%]";
  const arrowInset =
    branchCount <= 2
      ? wide
        ? "px-[12%] lg:px-[8%]"
        : "px-6"
      : wide
        ? "px-[6%]"
        : "px-[6%]";

  return (
    <button
      type="button"
      onClick={onSelect}
      title="Click to edit parallel split"
      aria-label="Edit parallel split branches"
      className={`group flex w-full flex-col items-center py-3 transition ${
        onSelect ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div
        className={`h-6 w-0.5 rounded-full transition ${
          selected ? "bg-blue-400" : "bg-zinc-300 group-hover:bg-zinc-400"
        }`}
      />
      <div
        className={`relative flex w-full items-center justify-center ${wide ? "px-[10%] lg:px-[6%]" : "px-4"}`}
      >
        <div
          className={`absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full transition ${
            selected ? "bg-blue-400" : "bg-zinc-300 group-hover:bg-zinc-400"
          } ${branchInset}`}
        />
        <div
          className="relative grid w-full"
          style={{
            gridTemplateColumns: `repeat(${branchCount}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: branchCount }, (_, index) => (
            <span
              key={`branch-junction-${index}`}
              className={`mx-auto size-1.5 rounded-full transition ${
                selected ? "bg-blue-400" : "bg-zinc-300 group-hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      </div>
      <div
        className={`relative mt-2 grid w-full ${arrowInset}`}
        style={{
          gridTemplateColumns: `repeat(${branchCount}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: branchCount }, (_, index) => (
          <div
            key={`branch-arrow-${index}`}
            className="flex flex-col items-center"
          >
            <div
              className={`h-4 w-0.5 rounded-full transition ${
                selected ? "bg-blue-500/90" : "bg-blue-400/80"
              }`}
            />
            <ChevronDown
              className={`size-3.5 transition ${
                selected ? "text-blue-600" : "text-blue-500"
              }`}
              strokeWidth={2.5}
            />
          </div>
        ))}
      </div>
    </button>
  );
}

export function FlowSplitRow({
  gapPx,
  children,
}: {
  gapPx: number;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex w-max max-w-none items-start justify-center"
      style={{ gap: gapPx }}
    >
      {children}
    </div>
  );
}
