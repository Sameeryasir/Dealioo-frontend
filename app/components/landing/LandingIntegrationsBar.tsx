"use client";

/**
 * Integrations marquee — dark scrolling brand strip only.
 */
import {
  FacebookLogo,
  GoogleAdsLogo,
  InstagramLogo,
  MetaLogo,
  StripeLogo,
} from "@/app/components/landing/LandingIntegrationLogos";
import { useEffect, useRef } from "react";

const BRANDS = [
  { id: "stripe", label: "Stripe", Logo: StripeLogo },
  { id: "meta", label: "Meta Ads", Logo: MetaLogo },
  { id: "facebook", label: "Facebook", Logo: FacebookLogo },
  { id: "instagram", label: "Instagram", Logo: InstagramLogo },
  { id: "google-ads", label: "Google Ads", Logo: GoogleAdsLogo },
] as const;

function BrandGroup({ groupId }: { groupId: string }) {
  return (
    <div className="landing-integrations-group">
      {BRANDS.map(({ id, label, Logo }) => (
        <div key={`${groupId}-${id}`} className="landing-integration-item">
          <Logo className="landing-integration-logo" idSuffix={`${groupId}-${id}`} />
          <span className="landing-integration-name">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function LandingIntegrationsBar() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let offset = 0;
    let frameId = 0;
    const speed = 0.75;

    const tick = () => {
      const loopWidth = track.scrollWidth / 2;
      if (loopWidth > 0) {
        offset += speed;
        if (offset >= loopWidth) offset = 0;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return (
    <section className="landing-integrations-section" aria-label="Platform integrations">
      <div className="landing-integrations-marquee landing-integrations-marquee-dark">
        <div ref={trackRef} className="landing-integrations-marquee-inner" aria-hidden>
          <BrandGroup groupId="a" />
          <BrandGroup groupId="b" />
          <BrandGroup groupId="c" />
          <BrandGroup groupId="d" />
        </div>
      </div>
    </section>
  );
}
