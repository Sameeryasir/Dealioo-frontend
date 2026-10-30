"use client";

import type { ReactNode } from "react";

type BusinessDetailRowProps = {
  label: string;
  value: ReactNode;
  htmlFor?: string;
  href?: string | null;
  showDivider?: boolean;
};

export function BusinessDetailRow({
  label,
  value,
  htmlFor,
  href,
  showDivider = true,
}: BusinessDetailRowProps) {
  const valueNode =
    href && typeof value === "string" && value !== "—" ? (
      <a
        id={htmlFor}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="m-0 block break-words text-[0.9rem] font-normal text-[#1464ff] no-underline hover:underline"
        title={value}
      >
        {value}
      </a>
    ) : (
      <p
        id={htmlFor}
        className="m-0 break-words text-[0.9rem] font-normal text-[#101a35]"
      >
        {value}
      </p>
    );

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 items-center py-3.5 ${
        showDivider ? "border-b border-[#eef2f7]" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.72rem] font-semibold text-[#7183a4]">
          {label}
        </p>
        <div className="mt-1">{valueNode}</div>
      </div>
    </div>
  );
}
