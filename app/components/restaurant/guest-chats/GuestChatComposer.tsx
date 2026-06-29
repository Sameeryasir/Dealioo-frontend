"use client";

import { useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";

function resizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
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
    <div className="shrink-0 bg-transparent px-4 py-3 sm:px-5">
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
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm leading-relaxed text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-label="Send message"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
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
