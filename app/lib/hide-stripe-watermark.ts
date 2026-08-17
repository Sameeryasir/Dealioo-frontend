"use client";

import { useEffect } from "react";

function isFloatingStripeWatermark(el: HTMLElement): boolean {
  if (el.closest("[data-dealioo-stripe-form]")) return false;

  const style = window.getComputedStyle(el);
  if (style.position !== "fixed") return false;

  const rect = el.getBoundingClientRect();
  const small = rect.width > 0 && rect.width <= 240 && rect.height <= 80;
  const nearBottomRight =
    rect.bottom >= window.innerHeight - 100 &&
    rect.right >= window.innerWidth - 260;
  if (!small || !nearBottomRight) return false;

  const src =
    `${el.id} ${el.className} ` +
    (el instanceof HTMLIFrameElement ? el.src : "") +
    (el.getAttribute("href") ?? "") +
    (el.getAttribute("title") ?? "") +
    (el.getAttribute("aria-label") ?? "") +
    (el.getAttribute("name") ?? "");

  return /stripe/i.test(src) || el instanceof HTMLIFrameElement;
}

export function hideStripeWatermark(): void {
  if (typeof document === "undefined") return;

  document.querySelectorAll("iframe, a, div, span").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (!isFloatingStripeWatermark(node)) return;
    node.setAttribute("data-dealioo-hidden-stripe-badge", "true");
    node.style.setProperty("display", "none", "important");
    node.style.setProperty("visibility", "hidden", "important");
    node.style.setProperty("opacity", "0", "important");
    node.style.setProperty("pointer-events", "none", "important");
    node.style.setProperty("width", "0", "important");
    node.style.setProperty("height", "0", "important");
  });
}

export function useHideStripeWatermark(): void {
  useEffect(() => {
    hideStripeWatermark();
    const observer = new MutationObserver(() => hideStripeWatermark());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);
}
