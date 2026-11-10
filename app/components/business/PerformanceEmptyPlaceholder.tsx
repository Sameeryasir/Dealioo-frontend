"use client";

import type { LucideIcon } from "lucide-react";

type PerformanceEmptyPlaceholderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Stretch to fill the parent section (chart / card body). */
  fill?: boolean;
  className?: string;
};

export function PerformanceEmptyPlaceholder({
  icon: Icon,
  title,
  description,
  fill = false,
  className = "",
}: PerformanceEmptyPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-10 text-center ${
        fill ? "h-full min-h-[12rem] flex-1" : "min-h-[12rem]"
      } ${className}`.trim()}
    >
      <Icon
        className="mb-4 size-8 text-slate-300"
        strokeWidth={1.75}
        aria-hidden
      />
      <p className="m-0 text-[1.05rem] font-extrabold tracking-tight text-[#07111f]">
        {title}
      </p>
      <p className="m-0 mt-2 max-w-md text-[0.82rem] font-medium leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}
