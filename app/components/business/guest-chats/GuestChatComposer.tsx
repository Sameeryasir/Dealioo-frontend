"use client";

import { useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";

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
}: {
  onSend: (body: string) => Promise<void>;
  sending?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = draft.trim().length > 0 && !sending && !disabled;

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
    <div className="shrink-0 border-t border-[#e8edf5] bg-gradient-to-t from-[#e8f2ff]/30 to-white px-4 py-3 sm:px-5">
      <div className="mx-auto flex max-w-3xl items-center gap-2.5">
        <label className="sr-only" htmlFor="guest-chat-message">
          Message
        </label>
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
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none overflow-y-hidden rounded-2xl border border-[#e8edf5] bg-white px-4 py-2.5 text-sm leading-relaxed text-[#07111f] shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-[#1877f2]/50 focus:ring-4 focus:ring-[#1877f2]/15 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-label="Send message"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1d84ff] via-[#1877f2] to-[#0f5ed7] text-white shadow-md shadow-[#1877f2]/25 transition hover:from-[#2b8fff] hover:via-[#1877f2] hover:to-[#1468e8] active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:from-zinc-200 disabled:via-zinc-200 disabled:to-zinc-200 disabled:shadow-none"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <SendHorizonal className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
