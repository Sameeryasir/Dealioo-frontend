"use client";

import { useEffect } from "react";
import { hideStripeTestingAssistant } from "@/app/lib/load-dealioo-stripe";

export function HideStripeTestingAssistant() {
  useEffect(() => {
    hideStripeTestingAssistant();
    const observer = new MutationObserver(() => {
      hideStripeTestingAssistant();
    });
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
