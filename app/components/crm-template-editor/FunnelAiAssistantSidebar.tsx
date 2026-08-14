"use client";

import {
  Bot,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";
import {
  editorPremiumCardClass,
  editorSettingsPanelShellEmbeddedClass,
} from "@/app/components/crm-template-editor/editor-sidebar-theme";
import type { TemplatePageId } from "@/app/components/crm-template-editor/template-types";
import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";
import { formatTimeShort } from "@/app/lib/datetime";
import {
  createAiConversation,
  createAiMessage,
  deleteAiConversation,
  listAiConversationsByFunnel,
  listAiMessagesAfter,
  listAllAiMessagesAfter,
  type AiConversationSummary,
  type AiMessagePageId,
} from "@/app/services/ai/ai-conversations";
import {
  appendCachedAiMessage,
  clearCachedAiMessages,
  getCachedAiConversations,
  getCachedAiMessages,
  setCachedAiConversations,
  setCachedAiMessages,
  upsertCachedAiConversation,
} from "@/app/services/ai/ai-chats-indexed-db";
import { editFunnelUiWithAi } from "@/app/services/ai/edit-funnel-ui";
import { isAiRevertChatIntent } from "@/app/services/ai/ai-revert-intent";
import {
  clearLandingImageWithAi,
  generateLandingImageWithAi,
} from "@/app/services/ai/generate-landing-image";
import { resolveLandingImageChatIntent } from "@/app/services/ai/landing-image-intent";
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
  createdAt: string;
};

const SUGGESTIONS_BY_PAGE: Record<TemplatePageId, readonly string[]> = {
  landing: [
    "Improve my landing headline",
    "Generate a new hero image",
    "Revert the last change",
  ],
  signup: [
    "What should the signup form ask?",
    "Improve the signup intro text",
    "Revert the last change",
  ],
  payment: [
    "Tips for the payment step",
    "Improve the payment headline",
    "Revert the last change",
  ],
  confirmation: [
    "Improve the confirmation headline",
    "Update the confirmation body copy",
    "Revert the last change",
  ],
};

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

function welcomeMessage(pageId: TemplatePageId): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text:
      pageId === "landing"
        ? `Hi — I’m your AI funnel assistant for the Landing step. Ask to improve copy, change colours/layout, generate a hero image, or say “revert” to undo the last change.`
        : `Hi — I’m your AI funnel assistant for the ${pageContextLabel(pageId)} step. Ask how to improve copy, CTAs, or conversion — or say “revert” to undo the last change.`,
    createdAt: new Date().toISOString(),
  };
}

function toChatMessage(input: {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}): ChatMessage {
  return {
    id: input.id,
    role: input.role === "user" ? "user" : "assistant",
    text: input.content,
    createdAt: input.createdAt,
  };
}

function isAiMessagePageId(pageId: TemplatePageId): pageId is AiMessagePageId {
  return (
    pageId === "landing" ||
    pageId === "signup" ||
    pageId === "payment" ||
    pageId === "confirmation"
  );
}

function conversationTabLabel(title: string | null | undefined): string {
  const trimmed = (title ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";

  const words = trimmed.split(" ");
  const short =
    words.length <= 4 ? trimmed : `${words.slice(0, 4).join(" ")}…`;
  if (short.length <= 28) return short;
  return `${short.slice(0, 28).trimEnd()}…`;
}

export function FunnelAiAssistantSidebar({
  pageId,
  businessId,
  campaignId,
  funnelId,
  pagePayload,
  onSchemaApplied,
  onLandingHeroUrlApplied,
  onUndoLastChange,
  onClose,
}: {
  pageId: TemplatePageId;
  businessId: number;
  campaignId?: number;
  funnelId?: number | null;
  pagePayload?: Record<string, unknown>;
  onSchemaApplied?: (schema: Record<string, unknown>) => void;
  onLandingHeroUrlApplied?: (imageUrl: string) => void;
  onUndoLastChange?: () => boolean;
  onClose?: () => void;
}) {
  const listId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);
  const tabsRailRef = useRef<HTMLDivElement>(null);
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [conversations, setConversations] = useState<AiConversationSummary[]>(
    [],
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [conversationPendingDelete, setConversationPendingDelete] =
    useState<AiConversationSummary | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    welcomeMessage(pageId),
  ]);

  const canPersist =
    Number.isFinite(businessId) &&
    businessId >= 1 &&
    funnelId != null &&
    funnelId >= 1;

  const showSuggestions = messages.length <= 1 && !sending && !bootstrapping;

  const loadConversationMessages = useCallback(
    async (conversationId: string, currentPageId: TemplatePageId) => {
      const cached = await getCachedAiMessages(conversationId);

      if (cached != null) {
        if (cached.length === 0) {
          setMessages([welcomeMessage(currentPageId)]);
        } else {
          setMessages(cached.map(toChatMessage));
        }

        try {
          const newestId = cached[cached.length - 1]?.id;
          if (!newestId) {
            return;
          }

          const checked = await listAllAiMessagesAfter({
            conversationId,
            lastMessageId: newestId,
            limit: 20,
          });

          if (checked.length === 0) {
            return;
          }

          const byId = new Map<string, (typeof cached)[number]>();
          for (const message of [...cached, ...checked]) {
            byId.set(message.id, message);
          }
          const merged = [...byId.values()].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          );
          await setCachedAiMessages({
            conversationId,
            messages: merged,
          });
          setMessages(
            merged.length > 0
              ? merged.map(toChatMessage)
              : [welcomeMessage(currentPageId)],
          );
        } catch {
        }
        return;
      }

      const response = await listAiMessagesAfter({
        conversationId,
        limit: 20,
      });
      await setCachedAiMessages({
        conversationId,
        messages: response.data,
      });
      if (response.data.length === 0) {
        setMessages([welcomeMessage(currentPageId)]);
        return;
      }
      setMessages(response.data.map(toChatMessage));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!canPersist || funnelId == null) {
        setConversations([]);
        setActiveConversationId(null);
        setMessages([welcomeMessage(pageIdRef.current)]);
        return;
      }

      setBootstrapping(true);
      try {
        const cachedConversations = await getCachedAiConversations(
          businessId,
          funnelId,
        );

        if (cachedConversations != null && cachedConversations.length > 0) {
          if (cancelled) return;
          setConversations(cachedConversations);
          const cachedActiveId = cachedConversations[0]?.id ?? null;
          setActiveConversationId(cachedActiveId);
          if (cachedActiveId) {
            await loadConversationMessages(
              cachedActiveId,
              pageIdRef.current,
            );
          }
          return;
        }

        let list = await listAiConversationsByFunnel(funnelId);
        if (cancelled) return;

        if (list.length === 0) {
          const created = await createAiConversation({
            businessId,
            funnelId,
          });
          if (cancelled) return;
          list = [
            {
              id: created.id,
              title: created.title,
              status: "ACTIVE",
              lastMessageAt: null,
              createdAt: created.createdAt,
              updatedAt: created.createdAt,
            },
          ];
        }

        await setCachedAiConversations({
          businessId,
          funnelId,
          conversations: list,
        });
        setConversations(list);
        const nextId = list[0]?.id ?? null;
        setActiveConversationId(nextId);
        if (nextId) {
          await loadConversationMessages(nextId, pageIdRef.current);
        }
      } catch {
        if (!cancelled) {
          const cachedConversations = await getCachedAiConversations(
            businessId,
            funnelId,
          );
          if (cachedConversations && cachedConversations.length > 0) {
            setConversations(cachedConversations);
            const cachedActiveId = cachedConversations[0]?.id ?? null;
            setActiveConversationId(cachedActiveId);
            if (cachedActiveId) {
              const cachedMessages = await getCachedAiMessages(cachedActiveId);
              setMessages(
                cachedMessages && cachedMessages.length > 0
                  ? cachedMessages.map(toChatMessage)
                  : [welcomeMessage(pageIdRef.current)],
              );
            }
          } else {
            setConversations([]);
            setActiveConversationId(null);
            setMessages([welcomeMessage(pageIdRef.current)]);
          }
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [businessId, funnelId, canPersist, loadConversationMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, bootstrapping]);

  useEffect(() => {
    if (!activeConversationId || !tabsRailRef.current) return;
    const activeTab = tabsRailRef.current.querySelector<HTMLElement>(
      `[data-conversation-id="${activeConversationId}"]`,
    );
    activeTab?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [activeConversationId, conversations.length]);

  async function handleSelectConversation(conversationId: string) {
    if (!conversationId || conversationId === activeConversationId) return;
    setActiveConversationId(conversationId);
    setBootstrapping(true);
    try {
      await loadConversationMessages(conversationId, pageId);
    } catch {
      setMessages([welcomeMessage(pageId)]);
    } finally {
      setBootstrapping(false);
    }
  }

  async function handleCloseConversation(
    conversationId: string,
    event: MouseEvent,
  ) {
    event.stopPropagation();
    if (sending || bootstrapping || isDeletingConversation) return;

    const target = conversations.find((item) => item.id === conversationId);
    if (!target) return;
    setConversationPendingDelete(target);
  }

  async function handleConfirmDeleteConversation() {
    const target = conversationPendingDelete;
    if (!target || isDeletingConversation) return;

    const conversationId = target.id;
    const index = conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) {
      setConversationPendingDelete(null);
      return;
    }

    setIsDeletingConversation(true);
    try {
      await deleteAiConversation(conversationId);
      await clearCachedAiMessages(conversationId);

      const remaining = conversations.filter(
        (item) => item.id !== conversationId,
      );
      setConversations(remaining);
      if (canPersist && funnelId != null) {
        await setCachedAiConversations({
          businessId,
          funnelId,
          conversations: remaining,
        });
      }

      setConversationPendingDelete(null);

      if (conversationId !== activeConversationId) return;

      const next =
        remaining[index - 1] ?? remaining[index] ?? remaining[0] ?? null;

      if (!next) {
        setActiveConversationId(null);
        setMessages([welcomeMessage(pageId)]);
        if (canPersist && funnelId != null) {
          await handleNewChat();
        }
        return;
      }

      setActiveConversationId(next.id);

      const cachedMessages = await getCachedAiMessages(next.id);
      if (cachedMessages != null) {
        setMessages(
          cachedMessages.length > 0
            ? cachedMessages.map(toChatMessage)
            : [welcomeMessage(pageId)],
        );
        void loadConversationMessages(next.id, pageId);
        return;
      }

      setBootstrapping(true);
      try {
        await loadConversationMessages(next.id, pageId);
      } catch {
        setMessages([welcomeMessage(pageId)]);
      } finally {
        setBootstrapping(false);
      }
    } catch {
    } finally {
      setIsDeletingConversation(false);
    }
  }

  async function handleNewChat() {
    if (!canPersist || funnelId == null || sending) return;
    setBootstrapping(true);
    try {
      const created = await createAiConversation({
        businessId,
        funnelId,
      });
      const summary: AiConversationSummary = {
        id: created.id,
        title: created.title,
        status: "ACTIVE",
        lastMessageAt: null,
        createdAt: created.createdAt,
        updatedAt: created.createdAt,
      };
      setConversations((prev) => [summary, ...prev]);
      setActiveConversationId(created.id);
      setMessages([welcomeMessage(pageId)]);
      await upsertCachedAiConversation({
        businessId,
        funnelId,
        conversation: summary,
      });
      await setCachedAiMessages({
        conversationId: created.id,
        messages: [],
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Could not start a new chat. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBootstrapping(false);
    }
  }

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || sending || bootstrapping) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    let conversationId = activeConversationId;

    try {
      if (canPersist && funnelId != null && !conversationId) {
        const created = await createAiConversation({
          businessId,
          funnelId,
        });
        conversationId = created.id;
        setActiveConversationId(created.id);
        const summary: AiConversationSummary = {
          id: created.id,
          title: created.title,
          status: "ACTIVE",
          lastMessageAt: null,
          createdAt: created.createdAt,
          updatedAt: created.createdAt,
        };
        setConversations((prev) => [summary, ...prev]);
        await upsertCachedAiConversation({
          businessId,
          funnelId,
          conversation: summary,
        });
        await setCachedAiMessages({
          conversationId: created.id,
          messages: [],
        });
      }

      if (conversationId) {
        const savedUser = await createAiMessage({
          conversationId,
          content: text,
          ...(isAiMessagePageId(pageId) ? { pageId } : {}),
          role: "user",
        });
        await appendCachedAiMessage({
          conversationId,
          message: savedUser,
        });
        setMessages((prev) =>
          prev.map((message) =>
            message.id === userMessage.id
              ? toChatMessage(savedUser)
              : message,
          ),
        );
        const nextTitle =
          savedUser.conversationTitle?.trim() || text.slice(0, 60);
        setConversations((prev) => {
          const updated = prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  title: nextTitle,
                  lastMessageAt: savedUser.createdAt,
                  updatedAt: savedUser.createdAt,
                }
              : conversation,
          );
          const sorted = [...updated].sort((a, b) => {
            const aTime = a.lastMessageAt ?? a.createdAt;
            const bTime = b.lastMessageAt ?? b.createdAt;
            return bTime.localeCompare(aTime);
          });
          if (funnelId != null) {
            void setCachedAiConversations({
              businessId,
              funnelId,
              conversations: sorted,
            });
          }
          return sorted;
        });
      }

      const alreadySaved = funnelId != null && funnelId >= 1;
      let assistantText = "";

      if (isAiRevertChatIntent(text)) {
        const reverted = onUndoLastChange?.() === true;
        assistantText = reverted
          ? "Done — I reverted the last change in the editor."
          : "There’s nothing to revert yet. Make a change first, then ask me to undo it.";
      } else {
      const imageIntent = resolveLandingImageChatIntent(pageId, text);

      if (imageIntent === "generate") {
        const result = await generateLandingImageWithAi({
          prompt: text,
          businessId,
          ...(campaignId != null ? { campaignId } : {}),
          ...(funnelId != null && funnelId >= 1 ? { funnelId } : {}),
        });

        if (result.schema && onSchemaApplied) {
          onSchemaApplied(result.schema);
        } else if (onLandingHeroUrlApplied) {
          onLandingHeroUrlApplied(result.imageUrl);
        } else if (onSchemaApplied) {
          onSchemaApplied({
            landing: {
              ...(pagePayload ?? {}),
              heroImageSrc: result.imageUrl,
              imageUrl: result.imageUrl,
            },
          });
        }

        assistantText =
          result.message?.trim() ||
          (alreadySaved
            ? "Done — I generated a new hero image and saved it to your funnel."
            : "Done — I generated a new hero image. Review the preview, then save if you want to keep it.");
      } else if (imageIntent === "remove") {
        if (alreadySaved) {
          const result = await clearLandingImageWithAi({
            businessId,
            ...(campaignId != null ? { campaignId } : {}),
            funnelId: funnelId as number,
          });
          if (result.schema && onSchemaApplied) {
            onSchemaApplied(result.schema);
          } else if (onLandingHeroUrlApplied) {
            onLandingHeroUrlApplied("");
          }
          assistantText =
            result.message?.trim() ||
            "Done — I removed the landing hero image.";
        } else if (onLandingHeroUrlApplied) {
          onLandingHeroUrlApplied("");
          assistantText = "Done — I removed the landing hero image.";
        } else if (onSchemaApplied) {
          onSchemaApplied({
            landing: {
              ...(pagePayload ?? {}),
              heroImageSrc: "",
              imageUrl: "",
            },
          });
          assistantText = "Done — I removed the landing hero image.";
        } else {
          assistantText = "I couldn’t remove the image in this editor state.";
        }
      } else {
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

        assistantText =
          result.message?.trim() ||
          (result.success
            ? alreadySaved
              ? "Done — I updated your funnel. Those changes are already saved."
              : "Done — I updated your funnel based on that request. Review the preview, then save if you want to keep it."
            : "I couldn’t complete that edit.");
      }
      }
      if (conversationId) {
        const savedAssistant = await createAiMessage({
          conversationId,
          content: assistantText,
          ...(isAiMessagePageId(pageId) ? { pageId } : {}),
          role: "assistant",
        });
        await appendCachedAiMessage({
          conversationId,
          message: savedAssistant,
        });
        setMessages((prev) => [...prev, toChatMessage(savedAssistant)]);
        setConversations((prev) => {
          const updated = prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessageAt: savedAssistant.createdAt,
                  updatedAt: savedAssistant.createdAt,
                  title:
                    savedAssistant.conversationTitle?.trim() ||
                    conversation.title,
                }
              : conversation,
          );
          const sorted = [...updated].sort((a, b) => {
            const aTime = a.lastMessageAt ?? a.createdAt;
            const bTime = b.lastMessageAt ?? b.createdAt;
            return bTime.localeCompare(aTime);
          });
          if (funnelId != null) {
            void setCachedAiConversations({
              businessId,
              funnelId,
              conversations: sorted,
            });
          }
          return sorted;
        });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: assistantText,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong talking to the AI.";

      if (conversationId) {
        try {
          const savedAssistant = await createAiMessage({
            conversationId,
            content: message,
            ...(isAiMessagePageId(pageId) ? { pageId } : {}),
            role: "assistant",
          });
          await appendCachedAiMessage({
            conversationId,
            message: savedAssistant,
          });
          setMessages((prev) => [...prev, toChatMessage(savedAssistant)]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: message,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: message,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <DeleteConfirmationDialog
        open={conversationPendingDelete != null}
        itemName={
          conversationTabLabel(conversationPendingDelete?.title) || "this chat"
        }
        title="Delete this conversation?"
        description={
          <>
            This permanently deletes{" "}
            <span className="font-semibold text-[#1877f2]">
              {conversationTabLabel(conversationPendingDelete?.title) ||
                "this chat"}
            </span>{" "}
            and all of its messages. This cannot be undone.
          </>
        }
        confirmText="Delete conversation"
        checkboxLabel="Are you sure you want to delete?"
        isLoading={isDeletingConversation}
        onConfirm={() => {
          void handleConfirmDeleteConversation();
        }}
        onCancel={() => {
          if (!isDeletingConversation) {
            setConversationPendingDelete(null);
          }
        }}
      />

      <aside
        className={`${editorSettingsPanelShellEmbeddedClass} min-w-0 w-full`}
        aria-label="AI assistant"
      >
      <div
        className={`${editorPremiumCardClass} flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden`}
      >
        <div className="min-w-0 shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
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
            {canPersist ? (
              <button
                type="button"
                aria-label="New chat"
                disabled={sending || bootstrapping}
                onClick={() => void handleNewChat()}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#e8f2ff] hover:text-[#1877f2] disabled:opacity-50"
              >
                <MessageSquarePlus
                  className="size-4"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </button>
            ) : null}
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

          {canPersist && conversations.length > 0 ? (
            <div
              ref={tabsRailRef}
              role="tablist"
              aria-label="AI conversations"
              className="flex min-w-0 w-full gap-1 overflow-x-auto overscroll-x-contain px-3 pb-2.5 pt-2 [scrollbar-width:thin] [scrollbar-color:rgb(203_213_225)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
            >
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <div
                    key={conversation.id}
                    data-conversation-id={conversation.id}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() =>
                      void handleSelectConversation(conversation.id)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void handleSelectConversation(conversation.id);
                      }
                    }}
                    className={`group flex max-w-[12.5rem] min-w-[7.5rem] shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-lg px-2.5 py-1.5 transition ${
                      isActive
                        ? "bg-[#e8f2ff] text-[#1877f2] shadow-sm ring-1 ring-[#1877f2]/20"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    } ${sending || bootstrapping ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <MessageSquare
                      className="size-3.5 shrink-0 opacity-80"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span
                      title={(conversation.title ?? "").trim() || "New chat"}
                      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.68rem] font-semibold tracking-tight"
                    >
                      {conversationTabLabel(conversation.title)}
                    </span>
                    {isActive ? (
                      <button
                        type="button"
                        aria-label={`Delete ${conversationTabLabel(conversation.title)}`}
                        onClick={(e) =>
                          void handleCloseConversation(conversation.id, e)
                        }
                        className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded text-slate-400 transition hover:bg-white/80 hover:text-slate-700"
                      >
                        <X className="size-3" strokeWidth={2.5} aria-hidden />
                      </button>
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden />
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          id={listId}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
          role="log"
          aria-live="polite"
        >
          {bootstrapping ? (
            <div className="flex items-center gap-2.5 text-[0.72rem] font-medium text-slate-500">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Loading chat…
            </div>
          ) : null}
          {!bootstrapping
            ? messages.map((message) => {
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
                      className={`flex max-w-[78%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-[0.78rem] leading-relaxed ${
                          isUser
                            ? "rounded-br-md bg-[#1877f2] font-medium text-white"
                            : "rounded-bl-md border border-slate-200 bg-slate-50 font-medium text-slate-700"
                        }`}
                      >
                        {message.text}
                      </div>
                      <time
                        dateTime={message.createdAt}
                        className="px-1 text-[0.62rem] font-medium text-slate-400"
                      >
                        {formatTimeShort(message.createdAt)}
                      </time>
                    </div>
                  </div>
                );
              })
            : null}
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
                {SUGGESTIONS_BY_PAGE[pageId].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={sending || bootstrapping}
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
            className="flex min-w-0 items-end gap-2.5"
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
              disabled={sending || bootstrapping}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              placeholder="Ask about this funnel step…"
              className="min-h-[3rem] min-w-0 flex-1 resize-none rounded-xl border border-[#e8edf5] bg-white px-3.5 py-2.5 text-[0.78rem] font-medium text-[#07111f] outline-none transition placeholder:text-slate-400 focus:border-[#1877f2]/45 focus:ring-4 focus:ring-[#1877f2]/12 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || bootstrapping || !input.trim()}
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
    </>
  );
}
