"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  LineChart,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { MetaLogo } from "@/app/components/landing/LandingIntegrationLogos";

function OrbitIcon({
  className,
  tone,
  children,
}: {
  className: string;
  tone: "blue" | "green" | "orange";
  children: ReactNode;
}) {
  const tones = {
    blue: "bg-[#e8f1ff] text-[#1877f2] ring-[#d2e3fc]",
    green: "bg-[#e6f4ea] text-[#188038] ring-[#ceead6]",
    orange: "bg-[#fff3e0] text-[#e37400] ring-[#fde0c3]",
  };
  return (
    <span
      className={`absolute flex size-11 items-center justify-center rounded-xl shadow-sm ring-1 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function MetaAdsConnectEmptyState({
  businessId,
  title = "Connect Meta Ads",
  description = "Open Settings → Integrations and connect your Meta Ads account to unlock campaign analytics and insights.",
}: {
  businessId: number;
  title?: string;
  description?: string;
}) {
  const integrationsHref = `/business/${businessId}/dashboard/settings/integrations`;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e8edf5] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)]">
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(180deg,#f5f9ff_0%,#eaf2ff_100%)] px-8 py-16 sm:min-h-[360px]">
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d5deea] sm:size-[22rem]" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-[13rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d5deea] sm:size-[16rem]" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d5deea] sm:size-[10.5rem]" />
          <span className="absolute left-[18%] top-[22%] size-2 rounded-full bg-[#8ab4f8]" />
          <span className="absolute right-[22%] top-[18%] size-2.5 rounded-full bg-[#66d4cf]" />
          <span className="absolute bottom-[24%] right-[28%] size-2 rounded-full bg-[#aecbfa]" />

          <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_16px_40px_-18px_rgba(24,119,242,0.55)] ring-1 ring-[#e8edf5] sm:size-32">
            <MetaLogo className="size-14 sm:size-16" />
          </div>

          <OrbitIcon className="left-[18%] top-[28%]" tone="blue">
            <LineChart className="size-5" strokeWidth={2.25} />
          </OrbitIcon>
          <OrbitIcon className="right-[16%] top-[24%]" tone="green">
            <BarChart3 className="size-5" strokeWidth={2.25} />
          </OrbitIcon>
          <OrbitIcon className="bottom-[22%] left-[22%]" tone="orange">
            <Users className="size-5" strokeWidth={2.25} />
          </OrbitIcon>
        </div>

        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-semibold text-[#1877f2]">
            <MetaLogo className="size-3.5" />
            Meta Ads Integration
          </span>
          <h2 className="mt-4 text-[1.85rem] font-bold tracking-tight text-brand-navy sm:text-[2.15rem]">
            {title}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-muted sm:text-[0.95rem]">
            {description}
          </p>

          <ul className="mt-7 space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1877f2]">
                <LineChart className="size-4" strokeWidth={2.25} />
              </span>
              <span>
                <p className="text-sm font-semibold text-brand-navy">
                  Campaign Analytics
                </p>
                <p className="text-sm text-brand-muted">
                  Track performance and key metrics in real-time.
                </p>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f4ea] text-[#188038]">
                <Target className="size-4" strokeWidth={2.25} />
              </span>
              <span>
                <p className="text-sm font-semibold text-brand-navy">
                  Better Targeting
                </p>
                <p className="text-sm text-brand-muted">
                  Optimize audiences and improve ad performance.
                </p>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3e8fd] text-[#7c3aed]">
                <ShieldCheck className="size-4" strokeWidth={2.25} />
              </span>
              <span>
                <p className="text-sm font-semibold text-brand-navy">
                  Secure & Private
                </p>
                <p className="text-sm text-brand-muted">
                  We only access the data you allow.
                </p>
              </span>
            </li>
          </ul>

          <Link
            href={integrationsHref}
            className="mt-8 inline-flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#1877f2] px-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-[#166fe0]"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-white">
              <MetaLogo className="size-5" />
            </span>
            <span className="flex-1 text-center">Open Integrations</span>
            <ArrowRight className="mr-1 size-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
