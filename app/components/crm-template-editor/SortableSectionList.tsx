"use client";

import { GripVertical } from "lucide-react";
import { useCallback, useState } from "react";
import { reorderList } from "@/app/lib/reorder-list";

const SECTION_DRAG_MIME = "application/x-funnel-section-index";

export function SortableSectionList<T extends string>({
  items,
  labels,
  onReorder,
}: {
  items: T[];
  labels: Record<T, string>;
  onReorder: (next: T[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const finishDrag = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (dragIndex == null) return;
      onReorder(reorderList(items, dragIndex, targetIndex));
      finishDrag();
    },
    [dragIndex, finishDrag, items, onReorder],
  );

  return (
    <ul className="space-y-1.5" role="list">
      {items.map((id, index) => {
        const dragging = dragIndex === index;
        const over = overIndex === index && dragIndex !== index;
        return (
          <li
            key={id}
            draggable
            onDragStart={(e) => {
              setDragIndex(index);
              e.dataTransfer.setData(SECTION_DRAG_MIME, String(index));
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={finishDrag}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverIndex(index);
            }}
            onDragLeave={() => {
              setOverIndex((prev) => (prev === index ? null : prev));
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            className={[
              "flex items-center gap-2 rounded-[1rem] border bg-white px-2.5 py-2 text-sm shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,opacity] duration-200",
              dragging ? "opacity-40" : "",
              over
                ? "border-[#1877f2]/45 ring-2 ring-[#1877f2]/15"
                : "border-[#e8edf5] hover:border-[#1877f2]/25 hover:bg-[#f4f8ff]/40",
            ].join(" ")}
          >
            <span
              className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-[#1877f2]/50 transition-colors duration-200 hover:text-[#1877f2] active:cursor-grabbing"
              aria-hidden
            >
              <GripVertical className="size-4" />
            </span>
            <span className="min-w-0 flex-1 font-semibold text-[#07111f]">
              {labels[id]}
            </span>
            <span className="text-[10px] font-semibold tabular-nums text-zinc-400">
              {index + 1}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
