"use client";

import { Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { setBlockDragData } from "@/app/components/automation/builder/automation-dnd";
import { AUTOMATION_BLOCKS } from "@/app/components/automation/mock-data";
import { nodeToneClass } from "@/app/components/automation/automation-ui";
import type { BlockSection, WorkflowNodeKind } from "@/app/components/automation/types";

const SECTIONS: { id: BlockSection; label: string }[] = [
  { id: "triggers", label: "Triggers" },
  { id: "actions", label: "Actions" },
  { id: "conditions", label: "Conditions" },
  { id: "flow", label: "Flow" },
];

export function BlockSidebar({
  onAddBlock,
}: {
  onAddBlock: (blockId: WorkflowNodeKind) => void;
}) {
  const [query, setQuery] = useState("");
  const didDragRef = useRef(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AUTOMATION_BLOCKS;
    return AUTOMATION_BLOCKS.filter((b) => b.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-zinc-200/80 bg-white shadow-[inset_-1px_0_0_rgba(0,0,0,0.02)] lg:w-[300px]">
      <div className="border-b border-zinc-100/90 bg-zinc-50/40 px-4 py-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">Blocks</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          Drag onto the canvas or click to add.
        </p>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search block…"
            className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900/8"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {SECTIONS.map((section) => {
          const blocks = filtered.filter((b) => b.section === section.id);
          if (blocks.length === 0) return null;
          return (
            <div key={section.id} className="mb-4 last:mb-2">
              <p className="mb-2 flex items-center gap-2 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-zinc-400">
                <span className="h-px min-w-[0.5rem] flex-1 bg-zinc-200/90" aria-hidden />
                {section.label}
                <span className="h-px min-w-[0.5rem] flex-1 bg-zinc-200/90" aria-hidden />
              </p>
              <div className="space-y-2">
                {blocks.map((block) => {
                  const tone = nodeToneClass(block.tone);
                  const Icon = block.icon;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      draggable
                      onDragStart={(e: React.DragEvent<HTMLButtonElement>) => {
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
                        onAddBlock(block.id);
                      }}
                      className={`flex w-full cursor-grab items-center gap-2.5 rounded-xl border px-3 py-2 text-left shadow-sm transition hover:-translate-y-px hover:shadow-md active:scale-[0.99] active:cursor-grabbing ${tone.shell}`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                      >
                        <Icon className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {block.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
