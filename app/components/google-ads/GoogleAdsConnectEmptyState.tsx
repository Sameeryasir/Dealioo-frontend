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
import { GoogleAdsLogo } from "@/app/components/landing/LandingIntegrationLogos";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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
    blue: "bg-[#e8f1ff] text-[#1a73e8] ring-[#d2e3fc]",
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

export function GoogleAdsConnectEmptyState({
  businessId,
  title = "Connect Google Ads",
  description = "Open Settings → Integrations and connect your Google Ads account to unlock campaign analytics and insights.",
}: {
  businessId: number;
  title?: string;
  description?: string;
}) {
  const integrationsHref = `/business/${businessId}/dashboard/settings/integrations`;

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e8edf5] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)]">
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="relative min-h-[280px] overflow-hidden bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3fb_100%)] px-8 py-16 sm:min-h-[360px]">
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d5deea] sm:size-[22rem]" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-[13rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d5deea] sm:size-[16rem]" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 size-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d5deea] sm:size-[10.5rem]" />
          <span className="absolute left-[18%] top-[22%] size-2 rounded-full bg-[#8ab4f8]" />
          <span className="absolute right-[22%] top-[18%] size-2.5 rounded-full bg-[#fdd663]" />
          <span className="absolute bottom-[24%] right-[28%] size-2 rounded-full bg-[#aecbfa]" />

          <div className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_16px_40px_-18px_rgba(26,115,232,0.55)] ring-1 ring-[#e8edf5] sm:size-32">
            <GoogleMark className="size-14 sm:size-16" />
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
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-semibold text-[#1967d2]">
            <GoogleAdsLogo className="size-3.5" />
            Google Ads Integration
          </span>
          <h2 className="mt-4 text-[1.85rem] font-bold tracking-tight text-brand-navy sm:text-[2.15rem]">
            {title}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-muted sm:text-[0.95rem]">
            {description}
          </p>

          <ul className="mt-7 space-y-4">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
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
            className="mt-8 inline-flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#1a73e8] px-3 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-[#1558c0]"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-white">
              <GoogleMark className="size-5" />
            </span>
            <span className="flex-1 text-center">Open Integrations</span>
            <ArrowRight className="mr-1 size-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
