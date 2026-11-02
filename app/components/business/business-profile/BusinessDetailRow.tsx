"use client";

import type { ReactNode } from "react";

type BusinessDetailRowProps = {
  label: string;
  value: ReactNode;
  htmlFor?: string;
  href?: string | null;
  wrap?: boolean;
  className?: string;
};

export function BusinessDetailRow({
  label,
  value,
  htmlFor,
  href,
  wrap = false,
  className = "",
}: BusinessDetailRowProps) {
  const isLink =
    Boolean(href) && typeof value === "string" && value !== "—" && value !== "";
  const valueClass = wrap
    ? "min-w-0 flex-1 break-words whitespace-pre-line text-sm font-medium leading-relaxed"
    : "min-w-0 flex-1 truncate text-sm font-medium";

  return (
    <div
      className={`flex min-w-0 gap-3 px-4 py-3 sm:px-5 ${
        wrap ? "items-start" : "items-center"
      } ${className}`}
    >
      <p className="w-[8.5rem] shrink-0 whitespace-nowrap pt-0.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500 sm:w-[9.5rem]">
        {label}
      </p>
      {isLink ? (
        <a
          id={htmlFor}
          href={href!}
          target="_blank"
          rel="noopener noreferrer"
          className={`${valueClass} text-[#1877f2] no-underline hover:underline`}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </a>
      ) : (
        <div
          id={htmlFor}
          className={`${valueClass} text-[#07111f]`}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
      )}
    </div>
  );
}
