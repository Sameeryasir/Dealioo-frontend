"use client";

import {
  profilePageCanvasClass,
  profileSectionCardClass,
} from "@/app/components/business/business-profile/profile-ui";
import { Skeleton } from "@/app/components/skeleton";

export function BusinessProfileSkeleton() {
  return (
    <div
      className={profilePageCanvasClass}
      aria-busy="true"
      aria-label="Loading business profile"
    >
      <div className="flex min-w-0 flex-col gap-5 px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
        <section className={profileSectionCardClass}>
          <div className="border-b border-[#eef2f7] px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 shrink-0 rounded-full bg-slate-100 sm:size-[4.5rem]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-24 rounded-full bg-slate-100" />
                  <Skeleton className="h-7 w-48 max-w-full rounded-lg bg-slate-100" />
                  <Skeleton className="h-4 w-56 max-w-full rounded-md bg-slate-100" />
                </div>
              </div>
              <Skeleton className="h-10 w-[8.5rem] rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="flex flex-wrap gap-5 px-5 py-3.5 sm:px-6">
            <Skeleton className="h-4 w-24 rounded bg-slate-100" />
            <Skeleton className="h-4 w-40 rounded bg-slate-100" />
            <Skeleton className="h-4 w-20 rounded bg-slate-100" />
          </div>
        </section>

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,20rem)]">
          <section className={`flex h-full flex-col ${profileSectionCardClass}`}>
            <div className="flex items-start gap-3 border-b border-[#eef2f7] bg-[#f8faff] px-5 py-4 sm:px-6">
              <Skeleton className="size-10 shrink-0 rounded-xl bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-36 rounded bg-slate-100" />
                <Skeleton className="h-3.5 w-56 max-w-full rounded bg-slate-100" />
              </div>
            </div>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="grid grid-cols-1 border-b border-[#eef2f7] sm:grid-cols-2 sm:divide-x sm:divide-[#e2e8f0]"
              >
                <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Skeleton className="h-3 w-24 rounded bg-slate-100" />
                  <Skeleton className="h-4 w-28 rounded bg-slate-100" />
                </div>
                <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Skeleton className="h-3 w-24 rounded bg-slate-100" />
                  <Skeleton className="h-4 w-28 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <section className={`${profileSectionCardClass} px-5 py-4`}>
              <Skeleton className="h-5 w-32 rounded bg-slate-100" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
                <Skeleton className="h-10 w-full rounded-xl bg-slate-100" />
              </div>
            </section>
            <section className={`${profileSectionCardClass} px-5 py-4`}>
              <Skeleton className="h-5 w-36 rounded bg-slate-100" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-8 w-full rounded bg-slate-100" />
                <Skeleton className="h-8 w-full rounded bg-slate-100" />
                <Skeleton className="h-8 w-full rounded bg-slate-100" />
              </div>
            </section>
            <section className={`${profileSectionCardClass} px-5 py-4`}>
              <Skeleton className="h-5 w-40 rounded bg-slate-100" />
              <div className="mt-4 flex items-center gap-4">
                <Skeleton className="size-[72px] shrink-0 rounded-full bg-slate-100" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-full rounded bg-slate-100" />
                  <Skeleton className="h-3.5 w-5/6 rounded bg-slate-100" />
                  <Skeleton className="h-3.5 w-4/5 rounded bg-slate-100" />
                  <Skeleton className="h-3.5 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
