import type { ReactNode } from "react";

export function StatusPill({
  className,
  children,
  size = "sm",
}: {
  className: string;
  children: ReactNode;
  size?: "sm" | "xs";
}) {
  const sizeClass =
    size === "xs"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold capitalize ring-1 ring-inset ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
}
