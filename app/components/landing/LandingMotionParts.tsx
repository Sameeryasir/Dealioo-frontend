"use client";

import { easeOut, fadeUp } from "@/app/components/landing/landing-motion";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/** Thin scroll progress bar, top of page, accessibility-safe. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <motion.div
      className="landing-scroll-progress"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      aria-hidden
    />
  );
}

/** Parallax layer, subtle Y shift tied to scroll. Respects reduced motion. */
export function ParallaxLayer({
  children,
  className = "",
  offset = 48,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/** Scroll-triggered fade-up wrapper, re-triggers once when entering viewport. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

/** Animated number counter when scrolled into view. */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals,
  className = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 65, damping: 20 });
  const display = useTransform(spring, (v) => {
    if (decimals != null) {
      return `${prefix}${v.toFixed(decimals)}${suffix}`;
    }
    if (Number.isInteger(value)) return `${prefix}${Math.round(v)}${suffix}`;
    return `${prefix}${v.toFixed(1)}${suffix}`;
  });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

/** Golootlo-style stat block with counting numbers. */
export function AnimatedStatBlock({
  value,
  prefix = "",
  suffix = "",
  decimals,
  label,
  delay = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.6, ease: easeOut }}
      className="text-center md:text-left"
    >
      <p className="landing-stat-value text-xl font-bold sm:text-2xl md:text-3xl">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      </p>
      <p className="landing-stat-label mt-1 text-xs sm:mt-1.5 sm:text-sm">{label}</p>
    </motion.div>
  );
}

/** Infinite horizontal marquee, Golootlo-style deal strip. */
export function MarqueeRow({
  items,
  reverse = false,
  accentEvery,
}: {
  items: string[];
  reverse?: boolean;
  accentEvery?: number;
}) {
  const doubled = [...items, ...items];

  return (
    <motion.div
      className="landing-marquee-mask relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: easeOut }}
    >
      <div
        className={`flex w-max gap-4 ${reverse ? "landing-marquee-track-reverse" : "landing-marquee-track"}`}
      >
        {doubled.map((item, i) => {
          const highlighted =
            accentEvery != null && accentEvery > 0 && i % accentEvery === 0;
          return (
            <motion.span
              key={`${item}-${i}`}
              className={`landing-deal-chip shrink-0 whitespace-nowrap px-5 py-2.5 text-sm font-semibold ${
                highlighted ? "landing-deal-chip-accent" : ""
              }`}
              whileHover={{ scale: 1.06, y: -2 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              {item}
            </motion.span>
          );
        })}
      </div>
    </motion.div>
  );
}

/** Dual-row marquee, Golootlo scrolling deals energy. */
export function DualMarquee({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      <MarqueeRow items={items} accentEvery={4} />
      <MarqueeRow items={[...items].reverse()} reverse accentEvery={5} />
    </div>
  );
}

/** Mini animated bar chart for dashboard preview. */
export function MiniBarChart() {
  const bars = [38, 62, 48, 78, 55, 88, 72];

  return (
    <div className="flex h-16 items-end gap-1.5">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="landing-bar-chart-col w-2.5 rounded-full sm:w-3"
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 * i, ease: easeOut }}
        />
      ))}
    </div>
  );
}

/** Floating orb background element. */
export function FloatingOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      animate={{ y: [0, -18, 0], x: [0, 10, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      aria-hidden
    />
  );
}

/** Staggered children list helper. */
export function StaggerGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
