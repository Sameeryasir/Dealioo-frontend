"use client";

import { LOGO_COLORS } from "@/app/components/landing/landing-brand";
import { motion } from "framer-motion";

const BLOBS = [
  { color: LOGO_COLORS.blue, className: "left-[-8%] top-[5%] h-[340px] w-[340px]", delay: 0 },
  { color: LOGO_COLORS.pink, className: "right-[-5%] top-[12%] h-[280px] w-[280px]", delay: 1.2 },
  { color: LOGO_COLORS.orange, className: "bottom-[8%] left-[20%] h-[220px] w-[220px]", delay: 2.4 },
  { color: LOGO_COLORS.green, className: "right-[15%] bottom-[15%] h-[200px] w-[200px]", delay: 0.8 },
  { color: LOGO_COLORS.purple, className: "left-[40%] top-[40%] h-[180px] w-[180px]", delay: 1.8 },
] as const;

/** Soft animated color blobs — logo palette wash behind hero (SuperBuzz-style contrast). */
export function LandingColorMesh() {
  return (
    <div className="landing-color-mesh pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`landing-mesh-blob absolute rounded-full ${blob.className}`}
          style={{ backgroundColor: blob.color }}
          animate={{
            x: [0, 18, -12, 0],
            y: [0, -22, 14, 0],
            scale: [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration: 14 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: blob.delay,
          }}
        />
      ))}
    </div>
  );
}
