"use client";

import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  editorPremiumCardClass,
  editorSettingsPanelShellEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";
import { editFunnelUiWithAi } from "@/app/services/ai/edit-funnel-ui";
import {
  pickAiEditableFields,
  pickAiFieldConstraints,
  normalizeLayoutUserInstruction,
} from "@/app/services/ai/pick-editable-fields";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const SUGGESTIONS = [
  "Improve my landing headline",
  "What should the signup form ask?",
  "Tips for the payment step",
] as const;

function pageContextLabel(pageId: TemplatePageId): string {
  switch (pageId) {
    case "landing":
      return "Landing";
    case "signup":
      return "Signup";
    case "payment":
      return "Payment";
    case "confirmation":
      return "Confirmation";
    default:
      return "Funnel";
  }
}

export function FunnelAiAssistantSidebar({
  pageId,
  businessId,
  campaignId,
  funnelId,
  pagePayload,
  onSchemaApplied,
  onClose,
}: {
  pageId: TemplatePageId;
  businessId: number;
  campaignId?: number;
  funnelId?: number | null;
  pagePayload?: Record<string, unknown>;
  onSchemaApplied?: (schema: Record<string, unknown>) => void;
  onClose?: () => void;
}) {
  const listId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      text: `Hi — I’m your AI funnel assistant for the ${pageContextLabel(pageId)} step. Ask how to improve copy, CTAs, or conversion.`,
    },
  ]);

  const showSuggestions = messages.length <= 1 && !sending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const normalizedInstruction = normalizeLayoutUserInstruction(text);
      const editableFields = pickAiEditableFields({
        pageId,
        pagePayload: pagePayload ?? {},
        userInstruction: normalizedInstruction,
      });
      const fieldConstraints = pickAiFieldConstraints({ editableFields });

      const result = await editFunnelUiWithAi({
        businessId,
        ...(campaignId != null ? { campaignId } : {}),
        ...(funnelId != null && funnelId >= 1 ? { funnelId } : {}),
        pageId,
        userInstruction: normalizedInstruction,
        ...(Object.keys(editableFields).length > 0
          ? { editableFields }
          : {}),
        ...(fieldConstraints != null ? { fieldConstraints } : {}),
      });

      if (result.schema && onSchemaApplied) {
        onSchemaApplied(result.schema);
      }

      const alreadySaved = funnelId != null && funnelId >= 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text:
            result.message?.trim() ||
            (result.success
              ? alreadySaved
                ? "Done — I updated your funnel. Those changes are already saved."
                : "Done — I updated your funnel based on that request. Review the preview, then save if you want to keep it."
              : "I couldn’t complete that edit."),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong talking to the AI.";
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: message,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <aside
      className={`${editorSettingsPanelShellEmbeddedClass} w-full`}
      aria-label="AI assistant"
    >
      <div
        className={`${editorPremiumCardClass} flex min-h-0 w-full flex-1 flex-col`}
      >
        <div className="shrink-0 border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-sm shadow-[#1877f2]/25"
              aria-hidden
            >
              <Sparkles className="size-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.85rem] font-extrabold tracking-tight text-[#07111f]">
                AI assistant
              </p>
              <p className="m-0 mt-0.5 truncate text-[0.7rem] font-medium text-slate-500">
                Growth AI · {pageContextLabel(pageId)} step
              </p>
            </div>
            {onClose ? (
              <button
                type="button"
                aria-label="Close AI assistant"
                onClick={onClose}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#e8f2ff] hover:text-[#1877f2]"
              >
                <X className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div
          id={listId}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
          role="log"
          aria-live="polite"
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser ? (
                  <span
                    className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f2ff] text-[#1877f2]"
                    aria-hidden
                  >
                    <Bot className="size-3.5" strokeWidth={2.25} />
                  </span>
                ) : null}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-relaxed ${
                    isUser
                      ? "rounded-br-md bg-[#1877f2] font-medium text-white"
                      : "rounded-bl-md border border-slate-200 bg-slate-50 font-medium text-slate-700"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            );
          })}
          {sending ? (
            <div className="flex items-center gap-2.5 pl-9 text-[0.72rem] font-medium text-slate-500">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Thinking…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-200 px-4 py-4">
          {showSuggestions ? (
            <div className="space-y-2">
              <p className="m-0 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                Try asking
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={sending}
                    onClick={() => void sendMessage(suggestion)}
                    className="cursor-pointer rounded-xl border border-[#e8edf5] bg-white px-3 py-2.5 text-left text-[0.72rem] font-semibold leading-snug text-slate-600 transition hover:border-[#1877f2]/35 hover:bg-[#f8faff] hover:text-[#1877f2] disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <form
            className="flex items-end gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <label className="sr-only" htmlFor={`${listId}-input`}>
              Message AI assistant
            </label>
            <textarea
              id={`${listId}-input`}
              rows={2}
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Ask about this funnel step…"
              className="min-h-[3rem] flex-1 resize-none rounded-xl border border-[#e8edf5] bg-white px-3.5 py-2.5 text-[0.78rem] font-medium text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-4 focus:ring-[#1877f2]/12 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-sm shadow-[#1877f2]/25 transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" strokeWidth={2.25} aria-hidden />
              )}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
