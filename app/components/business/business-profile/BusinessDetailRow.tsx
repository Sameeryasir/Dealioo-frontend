"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type DetailIconTone =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "pink"
  | "sky"
  | "amber"
  | "teal"
  | "indigo"
  | "rose";

const TONE_CLASS: Record<DetailIconTone, string> = {
  blue: "bg-[#e8f1ff] text-[#1464ff]",
  green: "bg-[#e8f8ef] text-[#16a34a]",
  purple: "bg-[#f3e8ff] text-[#8b5cf6]",
  orange: "bg-[#fff1e6] text-[#ea580c]",
  pink: "bg-[#fde8f0] text-[#e11d48]",
  sky: "bg-[#e0f2fe] text-[#0284c7]",
  amber: "bg-[#fff8e8] text-[#d97706]",
  teal: "bg-[#e6fffa] text-[#0d9488]",
  indigo: "bg-[#eef2ff] text-[#4f46e5]",
  rose: "bg-[#ffe4e6] text-[#e11d48]",
};

type BusinessDetailRowProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  htmlFor?: string;
  href?: string | null;
  showDivider?: boolean;
  tone?: DetailIconTone;
};

export function BusinessDetailRow({
  icon: Icon,
  label,
  value,
  htmlFor,
  href,
  showDivider = true,
  tone = "blue",
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
      className={`flex min-w-0 items-start gap-3 py-3.5 ${
        showDivider ? "border-b border-[#eef2f7]" : ""
      }`}
    >
      <span
        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${TONE_CLASS[tone]}`}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.72rem] font-semibold text-[#7183a4]">
          {label}
        </p>
        <div className="mt-1">{valueNode}</div>
      </div>
    </div>
  );
}
