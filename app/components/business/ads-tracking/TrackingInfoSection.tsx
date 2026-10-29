"use client";

import {
  ChartColumn,
  Crosshair,
  type LucideIcon,
  Sparkles,
  Zap,
} from "lucide-react";

type InfoItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconWrapClass: string;
  iconClass: string;
};

const INFO_ITEMS: InfoItem[] = [
  {
    id: "how",
    title: "How tracking works",
    description: "Saved IDs measure visits and conversions on supported funnels.",
    icon: ChartColumn,
    iconWrapClass: "bg-[#eff6ff] text-[#1877f2]",
    iconClass: "text-[#1877f2]",
  },
  {
    id: "auto",
    title: "Automatic integration",
    description: "IDs apply to eligible published funnel pages.",
    icon: Zap,
    iconWrapClass: "bg-violet-50 text-violet-600",
    iconClass: "text-violet-600",
  },
  {
    id: "events",
    title: "Track key events",
    description: "Track page views, checkout, and purchases.",
    icon: Crosshair,
    iconWrapClass: "bg-emerald-50 text-emerald-600",
    iconClass: "text-emerald-600",
  },
  {
    id: "optimize",
    title: "Optimize your ads",
    description: "Use conversion data to improve campaign results.",
    icon: Sparkles,
    iconWrapClass: "bg-sky-50 text-sky-600",
    iconClass: "text-sky-600",
  },
];

export function TrackingInfoSection() {
  return (
    <section
      aria-label="How tracking works"
      className="min-w-0 rounded-2xl border border-[#e8edf5] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)] sm:p-5 lg:p-6"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        {INFO_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`min-w-0 xl:px-5 ${
                index > 0 ? "xl:border-l xl:border-[#eef2f7]" : "xl:pl-0"
              } ${index === INFO_ITEMS.length - 1 ? "xl:pr-0" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${item.iconWrapClass}`}
                >
                  <Icon
                    className={`size-4 ${item.iconClass}`}
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#07111f]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
