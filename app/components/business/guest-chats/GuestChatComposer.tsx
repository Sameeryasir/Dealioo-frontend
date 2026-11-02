"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Smile } from "lucide-react";

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  const nextHeight = Math.min(element.scrollHeight, 128);
  element.style.height = `${nextHeight}px`;
  element.style.overflowY = element.scrollHeight > 128 ? "auto" : "hidden";
}

export function GuestChatComposer({
  onSend,
  sending = false,
  disabled = false,
  disabledReason = null,
  onDisabledActivate = null,
}: {
  onSend: (body: string) => Promise<void>;
  sending?: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
  onDisabledActivate?: (() => void) | null;
}) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = draft.trim().length > 0 && !sending && !disabled;
  const showBlockedOverlay = disabled && Boolean(onDisabledActivate);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending || disabled) {
      return;
    }

    setDraft("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
    await onSend(body);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-[#e8edf5] bg-white px-4 py-3.5 sm:px-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {disabledReason ? (
          <p className="m-0 px-1 text-xs text-slate-500">{disabledReason}</p>
        ) : null}
        <div className="relative flex items-end gap-2.5">
          {showBlockedOverlay ? (
            <button
              type="button"
              aria-label={disabledReason ?? "Messaging is unavailable"}
              onClick={() => onDisabledActivate?.()}
              className="absolute inset-0 z-10 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
          ) : null}

          <label className="sr-only" htmlFor="guest-chat-message">
            Message
          </label>

          <div
            className={`flex min-h-[3rem] min-w-0 flex-1 items-end gap-1 rounded-full border border-[#e2e8f0] bg-white py-1.5 pl-3.5 pr-2 shadow-[0_4px_18px_rgba(14,24,43,0.06)] transition focus-within:border-[#1877f2]/45 focus-within:ring-4 focus-within:ring-[#1877f2]/12 ${
              disabled || sending ? "opacity-60" : ""
            }`}
          >
            <button
              type="button"
              disabled={disabled || sending}
              tabIndex={showBlockedOverlay ? -1 : undefined}
              aria-label="Add emoji"
              className="mb-1.5 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-[#f4f7fb] hover:text-slate-600 disabled:cursor-not-allowed"
            >
              <Smile className="size-5" strokeWidth={1.75} aria-hidden />
            </button>

            <textarea
              ref={textareaRef}
              id="guest-chat-message"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                resizeTextarea(event.target);
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={disabled || sending}
              tabIndex={showBlockedOverlay ? -1 : undefined}
              placeholder="Type a message..."
              className="max-h-32 min-h-[2rem] flex-1 resize-none overflow-y-hidden bg-transparent py-2 pr-3 text-sm leading-relaxed text-[#07111f] outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            tabIndex={showBlockedOverlay ? -1 : undefined}
            aria-label="Send message"
            className="mb-0.5 inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.28)] transition hover:bg-[#166fe5] active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Send className="size-5" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
