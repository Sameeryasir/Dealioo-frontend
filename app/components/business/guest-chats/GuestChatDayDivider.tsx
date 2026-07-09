"use client";

export function GuestChatDayDivider({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 py-2">
      <span className="h-px flex-1 bg-zinc-200/90" aria-hidden />
      <span className="rounded-full border border-zinc-200/80 bg-zinc-100/95 px-4 py-1.5 text-[13px] font-semibold text-zinc-600 shadow-sm backdrop-blur-sm">
        {label}
      </span>
      <span className="h-px flex-1 bg-zinc-200/90" aria-hidden />
    </div>
  );
}
