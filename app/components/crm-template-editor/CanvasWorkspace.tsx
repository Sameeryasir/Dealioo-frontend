"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import {
  type ReactNode,
  type WheelEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { editorMotion } from "@/app/components/crm-template-editor/editor-animation";
import { FunnelPreviewSkeleton } from "@/app/components/crm-template-editor/FunnelPreviewSkeleton";
import {
  previewPhoneFrameClass,
  previewPhoneFrameEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-layout";

const PREVIEW_DESIGN_WIDTH = 420;
const PREVIEW_FALLBACK_HEIGHT = 760;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const CANVAS_PAD_X = 40;
const CANVAS_PAD_Y = 56;

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
}

function useNativePreviewSize(contentKey: string) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({
    width: PREVIEW_DESIGN_WIDTH,
    height: PREVIEW_FALLBACK_HEIGHT,
  });

  const measure = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const height = Math.max(el.offsetHeight, el.scrollHeight, 360);
    setSize({
      width: PREVIEW_DESIGN_WIDTH,
      height,
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    const t = window.setTimeout(measure, 80);
    return () => window.clearTimeout(t);
  }, [measure, contentKey]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, contentKey]);

  return { contentRef, size };
}

export function CanvasWorkspace({
  isLoading,
  loadError,
  children,
  embedded = false,
}: {
  isLoading?: boolean;
  loadError?: string | null;
  children: ReactNode;
  embedded?: boolean;
}) {
  const frameClass = embedded
    ? previewPhoneFrameEmbeddedClass
    : previewPhoneFrameClass;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentKey = isLoading ? "loading" : "ready";
  const { contentRef, size: nativeSize } = useNativePreviewSize(contentKey);

  const [zoom, setZoom] = useState(0.85);
  const [didInitialFit, setDidInitialFit] = useState(false);

  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);

  const fitToViewport = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const availW = Math.max(viewport.clientWidth - CANVAS_PAD_X * 2, 160);
    const availH = Math.max(viewport.clientHeight - CANVAS_PAD_Y * 2, 160);
    const pageH = Math.max(nativeSize.height, 360);
    const next = Math.min(
      availW / PREVIEW_DESIGN_WIDTH,
      availH / pageH,
      1,
    );
    setZoom(clampZoom(Math.max(next, 0.45)));
  }, [nativeSize.height]);

  const zoomOut = useCallback(() => {
    setZoom((current) => clampZoom(current - ZOOM_STEP));
  }, []);
  const zoomIn = useCallback(() => {
    setZoom((current) => clampZoom(current + ZOOM_STEP));
  }, []);
  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  useEffect(() => {
    if (isLoading || didInitialFit) return;
    if (nativeSize.height <= 360) return;
    fitToViewport();
    setDidInitialFit(true);
  }, [isLoading, didInitialFit, nativeSize.height, fitToViewport]);

  useEffect(() => {
    setDidInitialFit(false);
  }, [contentKey]);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((current) => clampZoom(current + delta));
  }, []);

  const scaledW = nativeSize.width * zoom;
  const scaledH = nativeSize.height * zoom;
  const canvasBg = embedded ? "bg-[#f4f6fa]" : "bg-[#eef2f7]";

  return (
    <main
      className={`relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden ${canvasBg}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.4) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(255,255,255,0.75),transparent_72%)]"
        aria-hidden
      />

      {loadError ? (
        <motion.p
          {...editorMotion.slideUp}
          className="absolute left-3 right-3 top-3 z-20 mx-auto w-full max-w-[min(420px,100%)] shrink-0 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-3 py-2 text-xs font-medium text-amber-950"
          role="status"
        >
          {loadError}
        </motion.p>
      ) : null}

      <div
        ref={viewportRef}
        onWheel={onWheel}
        className="relative z-[1] min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable]"
      >
        <div
          className="mx-auto flex min-h-full w-full justify-center px-8 py-10"
          style={{
            minWidth: scaledW + CANVAS_PAD_X * 2,
            alignItems:
              scaledH < (viewportRef.current?.clientHeight ?? 9999) - 48
                ? "center"
                : "flex-start",
          }}
        >
          <motion.div
            {...editorMotion.scaleIn}
            className="relative shrink-0"
            style={{
              width: scaledW || PREVIEW_DESIGN_WIDTH * zoom,
              height: scaledH || PREVIEW_FALLBACK_HEIGHT * zoom,
            }}
          >
            <div
              className={`${frameClass} absolute left-0 top-0 will-change-transform`}
              style={{
                width: PREVIEW_DESIGN_WIDTH,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <div ref={contentRef} className="flex w-full flex-col">
                {isLoading ? <FunnelPreviewSkeleton /> : children}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {!isLoading ? (
        <div
          className="pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-white/95 p-1 shadow-lg ring-1 ring-slate-950/5 backdrop-blur-sm sm:bottom-5 sm:right-5"
          title="Zoom the preview camera. Use Fit to see the full page."
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            className="flex size-8 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
          <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-slate-700">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            className="flex size-8 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={fitToViewport}
            className="flex size-8 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
            aria-label="Fit page to canvas"
            title="Fit full page"
          >
            <Maximize2 className="size-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="flex size-8 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
            aria-label="Reset zoom to 100%"
            title="Reset to 100%"
          >
            <RotateCcw className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </main>
  );
}
