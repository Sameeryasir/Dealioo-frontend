/**
 * What changed: Enterprise palette cards with descriptions, keyword search, drag affordance.
 * Why: Nontechnical owners need clearer block discovery without changing insert behavior.
 * Related: mock-data AUTOMATION_BLOCKS, automation-dnd, AutomationBuilderPage onAddBlock.
 */

"use client";

import { GripVertical, LayoutGrid, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  setActiveBlockDragKind,
  setBlockDragData,
} from "@/app/components/automation/builder/automation-dnd";
import { FLOW_SECTION_COLORS } from "@/app/components/automation/builder/flow-step-colors";
import {
  AUTOMATION_BLOCKS,
  getBlockByKind,
} from "@/app/components/automation/mock-data";
import type {
  BlockSection,
  WorkflowNodeKind,
} from "@/app/components/automation/types";
import { toast } from "sonner";

const BRANCH_PLACE_TIP =
  "Drag Branch onto the step after which you want to create it, then drop when that step highlights.";

function showBranchPlaceTip() {
  toast.message("How to add a Branch", {
    description: BRANCH_PLACE_TIP,
    duration: 5000,
  });
}

const SECTIONS: { id: BlockSection; label: string }[] = [
  { id: "triggers", label: "Triggers" },
  { id: "actions", label: "Actions" },
  { id: "conditions", label: "Conditions" },
  { id: "flow", label: "Flow" },
];

const SECTION_ACCENT: Record<BlockSection, { dot: string; chip: string }> = {
  triggers: {
    dot: "bg-[#1877f2]",
    chip: "bg-[#e8f1ff] text-[#1877f2] ring-[#dbeafe]",
  },
  actions: {
    dot: "bg-violet-500",
    chip: "bg-violet-500/10 text-violet-700 ring-violet-500/15",
  },
  conditions: {
    dot: "bg-orange-500",
    chip: "bg-orange-500/10 text-orange-700 ring-orange-500/15",
  },
  flow: {
    dot: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700 ring-sky-500/15",
  },
};

/** Match canvas node icon colors by section (not legacy tone alone). */
function iconClassForBlock(block: ReturnType<typeof getBlockByKind>): string {
  switch (block.section) {
    case "actions":
      return FLOW_SECTION_COLORS.actions.solid;
    case "conditions":
      return FLOW_SECTION_COLORS.conditions.solid;
    case "flow":
      return FLOW_SECTION_COLORS.flow.solid;
    case "triggers":
    default:
      return FLOW_SECTION_COLORS.triggers.solid;
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
  const unavailable = Boolean(block.unavailable);
  const locked = editLocked || unavailable;

  return (
    <button
      type="button"
      draggable={!locked}
      title={
        unavailable
          ? block.unavailableReason ?? "Not available"
          : block.description
      }
      onDragStart={(e: React.DragEvent<HTMLButtonElement>) => {
        if (locked) {
          e.preventDefault();
          if (editLocked) onEditBlocked?.();
          return;
        }
        didDragRef.current = true;
        setBlockDragData(e.dataTransfer, block.id);
        if (block.id === "parallel_split") {
          showBranchPlaceTip();
        }
      }}
      onDragEnd={() => {
        setActiveBlockDragKind(null);
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (didDragRef.current) return;
        if (unavailable) {
          toast.message(block.label, {
            description:
              block.unavailableReason ?? "This block is not available yet.",
          });
          return;
        }
        if (editLocked) {
          onEditBlocked?.();
          return;
        }
        if (block.id === "parallel_split") {
          showBranchPlaceTip();
        }
        onAddBlock(block.id);
      }}
      className={`group flex w-full items-start gap-2 rounded-xl border bg-white px-2.5 py-2 text-left transition ${
        locked
          ? "cursor-not-allowed border-zinc-200/80 opacity-55"
          : "cursor-grab border-zinc-200/90 hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:shadow-[0_6px_16px_rgba(24,119,242,0.08)] active:cursor-grabbing active:scale-[0.99]"
      }`}
    >
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${iconClassForBlock(block)}`}
      >
        <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[0.78rem] font-semibold tracking-tight text-zinc-900">
            {block.label}
          </span>
          {unavailable ? (
            <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-zinc-500">
              Soon
            </span>
          ) : null}
        </span>
        {block.description ? (
          <span className="mt-0.5 line-clamp-2 block text-[0.65rem] leading-snug text-zinc-500">
            {block.description}
          </span>
        ) : null}
      </span>
      {!locked ? (
        <GripVertical
          className="mt-1 size-3.5 shrink-0 text-zinc-300 transition group-hover:text-zinc-500"
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
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
      if (b.section === "triggers" && hideTriggers) return false;
      return true;
    });
    if (!q) return palette;
    return palette.filter((b) => {
      const haystack = [
        b.label,
        b.description ?? "",
        ...(b.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [hideTriggers, query]);

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-r border-zinc-200/70 bg-white">
      <div className="shrink-0 border-b border-zinc-100 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1877f2] text-white shadow-[0_6px_14px_rgba(24,119,242,0.28)]">
            <LayoutGrid className="size-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-[0.85rem] font-bold tracking-tight text-zinc-900">
              Blocks
            </h2>
            <p className="m-0 mt-0.5 text-[0.65rem] leading-snug text-zinc-500">
              Drag onto the canvas or click to add.
            </p>
          </div>
        </div>
        <div className="relative mt-2.5">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blocks…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-[#f8fafc] py-2 pl-8 pr-2.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[#1877f2] focus:bg-white focus:ring-2 focus:ring-[#1877f2]/15"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 [scrollbar-gutter:stable]">
        {query.trim() && filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-8 text-center text-xs leading-relaxed text-zinc-500">
            No blocks match “{query.trim()}”.
          </p>
        ) : null}
        {SECTIONS.map((section) => {
          const blocks = filtered.filter((b) => b.section === section.id);
          if (blocks.length === 0) return null;
          const accent = SECTION_ACCENT[section.id];
          return (
            <div key={section.id} className="mb-4 last:mb-1">
              <p className="mb-2 flex items-center gap-2 px-0.5">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${accent.dot}`}
                  aria-hidden
                />
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] ring-1 ${accent.chip}`}
                >
                  {section.label}
                </span>
                <span
                  className="h-px min-w-[0.5rem] flex-1 bg-zinc-200/80"
                  aria-hidden
                />
              </p>
              <div className="space-y-1.5">
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
