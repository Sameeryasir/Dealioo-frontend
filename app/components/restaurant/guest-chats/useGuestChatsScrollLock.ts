"use client";

import { useEffect } from "react";

export function useGuestChatsScrollLock() {
  useEffect(() => {
    const main = document.querySelector("main");
    const html = document.documentElement;
    const body = document.body;

    const previous = {
      mainOverflow: main instanceof HTMLElement ? main.style.overflow : "",
      mainHeight: main instanceof HTMLElement ? main.style.height : "",
      mainMaxHeight: main instanceof HTMLElement ? main.style.maxHeight : "",
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
    };

    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
      main.style.height = "100%";
      main.style.maxHeight = "100%";
    }

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      if (main instanceof HTMLElement) {
        main.style.overflow = previous.mainOverflow;
        main.style.height = previous.mainHeight;
        main.style.maxHeight = previous.mainMaxHeight;
      }

      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
    };
  }, []);
}
