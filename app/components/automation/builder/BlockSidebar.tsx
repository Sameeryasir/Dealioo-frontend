"use client";

import { LayoutGrid, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { setBlockDragData } from "@/app/components/automation/builder/automation-dnd";
import { AUTOMATION_BLOCKS, getBlockByKind } from "@/app/components/automation/mock-data";
import type { BlockSection, WorkflowNodeKind } from "@/app/components/automation/types";

const SIDEBAR_NODE_ICON =
  "bg-[#1877f2] text-white shadow-[0_4px_14px_rgba(24,119,242,0.35)]";

const SECTIONS: { id: BlockSection; label: string }[] = [
  { id: "triggers", label: "Triggers" },
  { id: "actions", label: "Actions" },
  { id: "conditions", label: "Conditions" },
  { id: "flow", label: "Flow" },
];

const VISIBLE_TRIGGER_IDS = new Set<WorkflowNodeKind>([
  "signup_trigger",
  "payment_trigger",
  "cron_trigger",
]);

const HIDDEN_BLOCK_IDS = new Set<WorkflowNodeKind>([
  "create_coupon",
  "tag_customer",
  "reviews",
]);

const SECTION_ACCENT: Record<
  BlockSection,
  { dot: string; chip: string }
> = {
  triggers: {
    dot: "bg-[#1877f2] shadow-[0_0_8px_rgba(24,119,242,0.45)]",
    chip: "bg-blue-500/10 text-blue-700 ring-blue-500/15",
  },
  actions: {
    dot: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.45)]",
    chip: "bg-violet-500/10 text-violet-700 ring-violet-500/15",
  },
  conditions: {
    dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.45)]",
    chip: "bg-orange-500/10 text-orange-700 ring-orange-500/15",
  },
  flow: {
    dot: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.45)]",
    chip: "bg-sky-500/10 text-sky-700 ring-sky-500/15",
  },
};

function blockBorderClass(tone: ReturnType<typeof getBlockByKind>["tone"]): string {
  switch (tone) {
    case "emerald":
      return "border-emerald-200/90 hover:border-emerald-300/90";
    case "blue":
      return "border-blue-200/90 hover:border-blue-300/90";
    case "violet":
      return "border-violet-200/90 hover:border-violet-300/90";
    case "orange":
      return "border-orange-200/90 hover:border-orange-300/90";
    case "amber":
      return "border-amber-200/90 hover:border-amber-300/90";
    default:
      return "border-zinc-200/90 hover:border-zinc-300/90";
  }
}

function BlockChip({
  blockId,
  onAddBlock,
  didDragRef,
  editLocked = false,
  onEditBlocked,
}: {
  blockId: WorkflowNodeKind;
  onAddBlock: (blockId: WorkflowNodeKind) => void;
  didDragRef: React.MutableRefObject<boolean>;
  editLocked?: boolean;
  onEditBlocked?: () => void;
}) {
  const block = getBlockByKind(blockId);
  const Icon = block.icon;

  return (
    <button
      type="button"
      draggable={!editLocked}
      onDragStart={(e: React.DragEvent<HTMLButtonElement>) => {
        if (editLocked) {
          e.preventDefault();
          onEditBlocked?.();
          return;
        }
        didDragRef.current = true;
        setBlockDragData(e.dataTransfer, block.id);
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (didDragRef.current) return;
        if (editLocked) {
          onEditBlocked?.();
          return;
        }
        onAddBlock(block.id);
      }}
      className={`group relative flex w-full items-center gap-2 overflow-hidden rounded-xl border bg-white px-2.5 py-2 text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.03] transition-all duration-200 xl:gap-3 xl:rounded-2xl xl:px-3 xl:py-2.5 ${
        editLocked
          ? "cursor-not-allowed opacity-60"
          : "cursor-grab hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,0,0,0.08)] active:scale-[0.98] active:cursor-grabbing"
      } ${blockBorderClass(block.tone)}`}
    >
      <span
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <span
        className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl ring-2 ring-white/90 ${SIDEBAR_NODE_ICON}`}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 to-transparent"
          aria-hidden
        />
        <Icon className="relative size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-tight text-zinc-900 xl:text-sm">
        {block.label}
      </span>
    </button>
  );
}

export function BlockSidebar({
  onAddBlock,
  editLocked = false,
  onEditBlocked,
  hideTriggers = false,
}: {
  onAddBlock: (blockId: WorkflowNodeKind) => void;
  editLocked?: boolean;
  onEditBlocked?: () => void;
  hideTriggers?: boolean;
}) {
  const [query, setQuery] = useState("");
  const didDragRef = useRef(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const palette = AUTOMATION_BLOCKS.filter((b) => {
      if (HIDDEN_BLOCK_IDS.has(b.id)) return false;
      if (b.section === "triggers") {
        if (hideTriggers) return false;
        return VISIBLE_TRIGGER_IDS.has(b.id);
      }
      return true;
    });
    if (!q) return palette;
    return palette.filter((b) => b.label.toLowerCase().includes(q));
  }, [hideTriggers, query]);

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-r border-zinc-200/60 bg-white shadow-[4px_0_28px_rgba(0,0,0,0.04)]">
      <div className="shrink-0 border-b border-zinc-100/90 bg-white px-2.5 py-3 lg:px-3 lg:py-3 xl:px-3.5 xl:py-3.5">
        <div className="flex items-start gap-2">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-200/70 shadow-sm ring-1 ring-blue-100/80 xl:size-9 xl:rounded-xl ${SIDEBAR_NODE_ICON}`}
          >
            <LayoutGrid className="size-3.5 xl:size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 xl:text-[0.95rem]">
              Blocks
            </h2>
            <p className="mt-0.5 hidden text-[0.65rem] leading-relaxed text-zinc-500 xl:block xl:text-xs">
              Drag onto the canvas or click to add.
            </p>
          </div>
        </div>
        <div className="relative mt-2.5 xl:mt-3.5">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search block…"
            className="h-9 w-full rounded-lg border border-zinc-200/80 bg-white py-2 pl-9 pr-2.5 text-xs text-zinc-900 shadow-sm ring-1 ring-zinc-950/[0.03] outline-none placeholder:text-zinc-400 transition focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/10 xl:h-11 xl:rounded-xl xl:pl-10 xl:pr-3 xl:text-sm"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-3 [scrollbar-gutter:stable] xl:px-2.5 xl:py-3.5">
        {query.trim() && filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200/80 bg-zinc-50/60 px-3 py-8 text-center text-xs leading-relaxed text-zinc-500">
            No blocks match your search.
          </p>
        ) : null}
        {SECTIONS.map((section) => {
          const blocks = filtered.filter((b) => b.section === section.id);
          if (blocks.length === 0) return null;
          const accent = SECTION_ACCENT[section.id];
          return (
            <div key={section.id} className="mb-5 last:mb-2">
              <p className="mb-2.5 flex items-center gap-2 px-0.5">
                <span
                  className={`size-2 shrink-0 rounded-full ${accent.dot}`}
                  aria-hidden
                />
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] ring-1 ${accent.chip}`}
                >
                  {section.label}
                </span>
                <span className="h-px min-w-[0.5rem] flex-1 bg-zinc-200/70" aria-hidden />
              </p>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <BlockChip
                    key={block.id}
                    blockId={block.id}
                    onAddBlock={onAddBlock}
                    didDragRef={didDragRef}
                    editLocked={editLocked}
                    onEditBlocked={onEditBlocked}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
