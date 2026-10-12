"use client";

type PrefetchFn = (href: string) => void;

let editorChunkPromise: Promise<unknown> | null = null;

export function warmupFunnelEditorChunk(): Promise<unknown> {
  if (!editorChunkPromise) {
    editorChunkPromise = import(
      "@/app/components/crm-template-editor/CrmTemplateEditor"
    );
  }
  return editorChunkPromise;
}

export function warmupFunnelEditor(
  prefetch: PrefetchFn,
  href?: string | null,
): void {
  if (href) prefetch(href);
  void warmupFunnelEditorChunk();
}

export function scheduleFunnelEditorIdleWarmup(
  prefetch: PrefetchFn,
  href?: string | null,
): () => void {
  if (!href) return () => undefined;

  prefetch(href);

  const run = () => {
    void warmupFunnelEditorChunk();
  };

  const requestIdleCallback = window.requestIdleCallback?.bind(window);
  if (requestIdleCallback) {
    const idleId = requestIdleCallback(run);
    return () => window.cancelIdleCallback?.(idleId);
  }

  const timeoutId = globalThis.setTimeout(run, 400);
  return () => globalThis.clearTimeout(timeoutId);
}
