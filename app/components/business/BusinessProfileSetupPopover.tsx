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
  placement: "above" | "below";
};

const POPOVER_WIDTH = 300;
const VIEW_PAD = 12;

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
    const panelHeight = panel.offsetHeight || 360;
    const spaceAbove = rect.top - VIEW_PAD;
    const spaceBelow = window.innerHeight - rect.bottom - VIEW_PAD;
    const preferAbove = spaceAbove >= panelHeight || spaceAbove >= spaceBelow;

    let top = preferAbove
      ? rect.top - panelHeight - 10
      : rect.bottom + 10;
    top = Math.max(
      VIEW_PAD,
      Math.min(top, window.innerHeight - panelHeight - VIEW_PAD),
    );

    let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
    left = Math.max(
      VIEW_PAD,
      Math.min(left, window.innerWidth - POPOVER_WIDTH - VIEW_PAD),
    );

    setPos({
      top,
      left,
      placement: preferAbove ? "above" : "below",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, setup.completedCount, updatePosition]);

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
        aria-label="Profile Setup Progress"
        className={`org-biz-setup-popover${pos ? " org-biz-setup-popover--visible" : ""}`}
        data-placement={pos?.placement ?? "above"}
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
          <header className="org-biz-setup-popover-head">
            <p className="org-biz-setup-popover-title">Profile Setup Progress</p>
            <p className="org-biz-setup-popover-subtitle">
              Finish these steps to complete your business profile.
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
            <div className="org-biz-setup-popover-stats">
              <span>
                Completed: {setup.completedCount} / {setup.totalCount}
              </span>
              <span>Profile Completion: {setup.progressPercent}%</span>
            </div>
            {setup.firstIncompleteHref ? (
              <button
                type="button"
                className="org-biz-setup-popover-cta"
                onClick={(event) => {
                  stopCardNavigation(event);
                  goTo(setup.firstIncompleteHref!);
                }}
              >
                Continue Setup
              </button>
            ) : (
              <p className="org-biz-setup-popover-done-note">
                All setup steps are complete.
              </p>
            )}
          </footer>
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
