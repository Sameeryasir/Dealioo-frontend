"use client";

/**
 * Fresh landing entry — scroll to top and reset client state when users return
 * (browser back from signup, bfcache restore, etc.).
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useLandingPageEntry() {
  const pathname = usePathname();
  const [entryKey, setEntryKey] = useState(0);

  useEffect(() => {
    if (pathname !== "/") return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const onPopState = () => {
      window.scrollTo(0, 0);
      setEntryKey((key) => key + 1);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname]);

  return entryKey;
}
