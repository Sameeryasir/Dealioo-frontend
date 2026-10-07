"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function TableNoResultsEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <Icon
        className="mb-4 size-10 text-[#1877f2]"
        strokeWidth={1.75}
        aria-hidden
      />
      <h3 className="m-0 max-w-md text-[1.15rem] font-extrabold tracking-tight text-[#07111f] sm:text-[1.25rem]">
        {title}
      </h3>
      <p className="m-0 mt-2 max-w-md text-[0.88rem] font-medium leading-relaxed text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
