"use client";

import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AUTOMATION_BLOCKS } from "@/app/components/automation/mock-data";
import { nodeToneClass } from "@/app/components/automation/automation-ui";
import type { BlockSection } from "@/app/components/automation/types";

const SECTIONS: { id: BlockSection; label: string }[] = [
  { id: "triggers", label: "Triggers" },
  { id: "actions", label: "Actions" },
  { id: "conditions", label: "Conditions" },
  { id: "flow", label: "Flow" },
];

export function BlockSidebar({
  onAddBlock,
}: {
  onAddBlock: (blockId: (typeof AUTOMATION_BLOCKS)[number]["id"]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AUTOMATION_BLOCKS;
    return AUTOMATION_BLOCKS.filter((b) => b.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-zinc-200/90 bg-white/80 backdrop-blur-xl lg:w-[300px]">
      <div className="border-b border-zinc-100 px-4 py-4">
        <h2 className="text-sm font-bold tracking-tight text-zinc-900">Blocks</h2>
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search block…"
            className="h-10 w-full rounded-xl border border-zinc-200/90 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {SECTIONS.map((section) => {
          const blocks = filtered.filter((b) => b.section === section.id);
          if (blocks.length === 0) return null;
          return (
            <div key={section.id} className="mb-5">
              <p className="mb-2 px-1 text-[0.65rem] font-bold uppercase tracking-wide text-zinc-500">
                {section.label}
              </p>
              <div className="space-y-2">
                {blocks.map((block) => {
                  const tone = nodeToneClass(block.tone);
                  const Icon = block.icon;
                  return (
                    <motion.button
                      key={block.id}
                      type="button"
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      dragElastic={0.2}
                      onClick={() => onAddBlock(block.id)}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex w-full cursor-grab items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left shadow-sm transition active:cursor-grabbing ${tone.shell}`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                      >
                        <Icon className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {block.label}
                      </span>
                    </motion.button>
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