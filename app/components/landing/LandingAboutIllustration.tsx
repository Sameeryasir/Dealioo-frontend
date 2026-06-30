"use client";
import type { AboutPreviewId } from "@/app/components/landing/LandingAboutPreviews";
import { LandingAboutPreview } from "@/app/components/landing/LandingAboutPreviews";
import { easeOut } from "@/app/components/landing/landing-motion";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useState, type CSSProperties } from "react";

export const ABOUT_IMAGE_SPEC = {
  width: 800,
  height: 600,
  format: "PNG (transparent or #f8faff background)",
  subjectPlacement: "Bottom 65% of canvas — keep top ~35% empty for crop",
  displayWidth: "280–320px on desktop",
} as const;

export const ABOUT_ILLUSTRATIONS: Record<
  AboutPreviewId,
  { src: string; alt: string }
> = {
  "who-we-are": {
    src: "/about/about-who-we-are.png",
    alt: "3D illustration — business operator thinking about guest journeys",
  },
  "what-we-do": {
    src: "/about/about-what-we-do.png",
    alt: "3D illustration — ads, funnels, payments and QR connected",
  },
  "our-mission": {
    src: "/about/about-our-mission.png",
    alt: "3D illustration — tracking click, pay and walk-in proof",
  },
};

type LandingAboutIllustrationProps = {
  id: AboutPreviewId;
  accentColor: string;
};

export function LandingAboutIllustration({ id, accentColor }: LandingAboutIllustrationProps) {
  const reduced = useReducedMotion();
  const illustration = ABOUT_ILLUSTRATIONS[id];
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <div className="landing-about-preview aspect-[16/10] w-full overflow-hidden">
        <LandingAboutPreview id={id} />
      </div>
    );
  }

  return (
    <div
      className="landing-about-illustration-stage relative flex h-[9.25rem] w-full items-end justify-center overflow-hidden bg-[#f8faff] sm:h-[10.5rem] md:h-[11.25rem]"
      data-about-tab={id}
      style={{ "--about-accent": accentColor } as CSSProperties}
    >
      <motion.div
        className="landing-about-illustration-float relative z-[1] flex h-[92%] w-full items-end justify-center"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        <Image
          src={illustration.src}
          alt={illustration.alt}
          width={ABOUT_IMAGE_SPEC.width}
          height={ABOUT_IMAGE_SPEC.height}
          className="landing-about-illustration h-full w-auto max-w-[min(100%,16rem)] object-contain object-bottom sm:max-w-[min(100%,17.5rem)] md:max-w-[min(100%,18.5rem)]"
          onError={() => setUseFallback(true)}
          priority={id === "who-we-are"}
        />
      </motion.div>
    </div>
  );
}
