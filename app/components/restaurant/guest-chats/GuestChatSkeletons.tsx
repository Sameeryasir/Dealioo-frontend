"use client";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={`guest-chat-shimmer relative overflow-hidden rounded-xl bg-zinc-100 ${className ?? ""}`} aria-hidden />
  );
}

export function GuestChatSidebarSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading guest threads">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="rounded-xl border border-zinc-200/70 bg-white px-3 py-2.5">
          <div className="flex gap-3">
            <ShimmerBlock className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-2/3" />
              <ShimmerBlock className="h-3.5 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GuestChatHeaderSkeleton() {
  return (
    <div className="border-b border-zinc-200/80 bg-white px-4 py-3 sm:px-5" aria-busy="true">
      <div className="flex items-center gap-3">
        <ShimmerBlock className="size-10 shrink-0 rounded-xl" />
        <ShimmerBlock className="h-4 w-40" />
      </div>
    </div>
  );
}

export function GuestChatMessagesSkeleton() {
  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-6 py-8" aria-busy="true">
      <ShimmerBlock className="mx-auto h-8 w-40 rounded-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-zinc-200/70 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <ShimmerBlock className="h-4 w-40" />
            <ShimmerBlock className="h-4 w-24" />
          </div>
          <ShimmerBlock className="mt-6 h-20 w-full" />
        </div>
      ))}
    </div>
  );
}
