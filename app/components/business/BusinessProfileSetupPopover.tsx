"use client";

import type { BusinessProfileSetup } from "@/app/lib/business-profile-setup";
import { CheckCircle2, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type BusinessProfileSetupPopoverProps = {
  setup: BusinessProfileSetup;
  children: ReactNode;
};

type PopoverPos = {
  top: number;
  left: number;
  placement: "above" | "below" | "right" | "left";
};

const POPOVER_WIDTH = 280;
const VIEW_PAD = 16;
const GAP = 10;

export function BusinessProfileSetupPopover({
  setup,
  children,
}: BusinessProfileSetupPopoverProps) {
  const router = useRouter();
  const triggerId = useId();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);

  const isComplete =
    setup.completedCount >= setup.totalCount && setup.totalCount > 0;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const openPopover = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 140);
  }, [clearCloseTimer]);

  useEffect(() => {
    setMounted(true);
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight || (isComplete ? 140 : 320);
    const spaceAbove = rect.top - VIEW_PAD;
    const spaceBelow = window.innerHeight - rect.bottom - VIEW_PAD;

    let placement: PopoverPos["placement"];
    let top: number;
    let left: number;

    if (isComplete) {
      placement = "above";
      left = rect.left + (rect.width - POPOVER_WIDTH) / 2;
      top = rect.top - panelHeight - GAP;
      if (top < VIEW_PAD) {
        top = VIEW_PAD;
      }
    } else {
      const nearTop = rect.top < 220;
      const preferBelow =
        nearTop ||
        spaceBelow >= panelHeight ||
        (spaceBelow >= 160 && spaceBelow >= spaceAbove);
      placement = preferBelow ? "below" : "above";
      top = preferBelow ? rect.bottom + GAP : rect.top - panelHeight - GAP;
      left = rect.left;
    }

    top = Math.max(
      VIEW_PAD,
      Math.min(top, window.innerHeight - panelHeight - VIEW_PAD),
    );
    left = Math.max(
      VIEW_PAD,
      Math.min(left, window.innerWidth - POPOVER_WIDTH - VIEW_PAD),
    );

    setPos({ top, left, placement });
  }, [isComplete]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, setup.completedCount, isComplete, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close, updatePosition]);

  const stopCardNavigation = (event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleTriggerClick = (event: ReactMouseEvent) => {
    stopCardNavigation(event);
    setOpen((current) => !current);
  };

  const goTo = (href: string) => {
    close();
    router.push(href);
  };

  const panel =
    mounted && open ? (
      <div
        ref={panelRef}
        id={`${triggerId}-panel`}
        role="dialog"
        aria-label={
          isComplete ? "Profile setup complete" : "Profile setup progress"
        }
        className={`org-biz-setup-popover${pos ? " org-biz-setup-popover--visible" : ""}${
          isComplete ? " org-biz-setup-popover--complete" : ""
        }`}
        data-placement={pos?.placement ?? "below"}
        style={
          pos
            ? {
                top: pos.top,
                left: pos.left,
                width: POPOVER_WIDTH,
              }
            : { visibility: "hidden", top: 0, left: 0, width: POPOVER_WIDTH }
        }
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        onClick={stopCardNavigation}
      >
        <div className="org-biz-setup-popover-inner">
          {isComplete ? (
            <div className="org-biz-setup-popover-complete">
              <span className="org-biz-setup-popover-complete-icon" aria-hidden>
                <CheckCircle2 className="size-5" strokeWidth={2.25} />
              </span>
              <p className="org-biz-setup-popover-title">Profile complete</p>
              <p className="org-biz-setup-popover-subtitle">
                All {setup.totalCount} setup steps are done for this business.
              </p>
              <p className="org-biz-setup-popover-complete-meta">
                {setup.completedCount}/{setup.totalCount} ·{" "}
                {setup.progressPercent}%
              </p>
            </div>
          ) : (
            <>
              <header className="org-biz-setup-popover-head">
                <p className="org-biz-setup-popover-title">
                  Finish profile setup
                </p>
                <p className="org-biz-setup-popover-subtitle">
                  {setup.totalCount - setup.completedCount} step
                  {setup.totalCount - setup.completedCount === 1 ? "" : "s"} left
                  · {setup.progressPercent}% complete
                </p>
              </header>

              <ul className="org-biz-setup-popover-list">
                {setup.steps.map((step) => (
                  <li key={step.id}>
                    {step.done ? (
                      <span className="org-biz-setup-popover-item org-biz-setup-popover-item--done">
                        <CheckCircle2
                          className="size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{step.label}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="org-biz-setup-popover-item org-biz-setup-popover-item--todo"
                        onClick={(event) => {
                          stopCardNavigation(event);
                          goTo(step.href);
                        }}
                      >
                        <Clock3
                          className="size-3.5 shrink-0"
                          strokeWidth={2.25}
                          aria-hidden
                        />
                        <span>{step.label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <footer className="org-biz-setup-popover-footer">
                {setup.firstIncompleteHref ? (
                  <button
                    type="button"
                    className="org-biz-setup-popover-cta"
                    onClick={(event) => {
                      stopCardNavigation(event);
                      goTo(setup.firstIncompleteHref!);
                    }}
                  >
                    Continue setup
                  </button>
                ) : null}
              </footer>
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="org-biz-card-bento-cell org-biz-card-progress-wrap org-biz-card-progress-wrap--interactive"
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${triggerId}-panel` : undefined}
        onClick={handleTriggerClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            setOpen((current) => !current);
          }
        }}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        onFocus={openPopover}
      >
        {children}
      </div>
      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
