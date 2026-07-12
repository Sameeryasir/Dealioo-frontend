"use client";

export function GuestChatDayDivider({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 py-2">
      <span className="h-px flex-1 bg-[#1877f2]/15" aria-hidden />
      <span className="rounded-full border border-[#1877f2]/15 bg-[#e8f2ff]/80 px-4 py-1.5 text-[13px] font-semibold text-[#1877f2] shadow-sm backdrop-blur-sm">
        {label}
      </span>
      <span className="h-px flex-1 bg-[#1877f2]/15" aria-hidden />
    </div>
  );
}
