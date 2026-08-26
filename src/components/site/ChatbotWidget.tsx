import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Loader2, SendHorizontal, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { sendChatbotMessage } from "@/functions/chatbot";
import { useLanguage } from "@/lib/i18n";
import type { ChatErrorCode, ChatHistoryItem } from "@/lib/chatbot/types";
import { CHATBOT_MAX_MESSAGE_LENGTH, getOrCreateChatSessionId } from "@/lib/chatbot/session";
import { AssistantMessageContent } from "@/lib/chatbot/renderAssistantMessage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface QuickReply {
  label: string;
  message: string;
}

const CHATBOT_TEASER_SEEN_KEY = "lunayair.chatbot.teaserSeen";
const CHATBOT_BADGE_CLEARED_KEY = "lunayair.chatbot.badgeCleared";

function createMessageId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((message) => !message.error)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function formatTime(date: Date, language: "en" | "ar"): string {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isPhoneLikeViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 640px), (pointer: coarse)").matches;
}

function hasSeenChatTeasers(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(CHATBOT_TEASER_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markChatTeasersSeen() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHATBOT_TEASER_SEEN_KEY, "1");
  } catch {
    // ignore
  }
}

function hasClearedChatBadge(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(CHATBOT_BADGE_CLEARED_KEY) === "1";
  } catch {
    return false;
  }
}

function markChatBadgeCleared() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHATBOT_BADGE_CLEARED_KEY, "1");
  } catch {
    // ignore
  }
}

type AudioContextConstructor = typeof AudioContext;

let messageAudioContext: AudioContext | null = null;

function getMessageAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!AC) return null;
  if (!messageAudioContext) {
    try {
      messageAudioContext = new AC();
    } catch {
      return null;
    }
  }
  return messageAudioContext;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.linearRampToValueAtTime(volume * 0.55, start + duration * 0.4);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Louder dual “new message” chimes (one per teaser bubble). */
async function playMessagePopSound(): Promise<boolean> {
  try {
    const ctx = getMessageAudioContext();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") return false;

    const now = ctx.currentTime;
    // First bubble
    playTone(ctx, 988, now, 0.15, 0.28);
    playTone(ctx, 1319, now + 0.08, 0.18, 0.22);
    // Second bubble
    playTone(ctx, 988, now + 0.32, 0.15, 0.26);
    playTone(ctx, 1319, now + 0.4, 0.18, 0.2);
    return true;
  } catch {
    return false;
  }
}

export function ChatbotWidget() {
  const { t, tv, language, isRTL } = useLanguage();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/" || pathname === "";
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const stickToBottomRef = useRef(true);
  const lastUserMessageRef = useRef<string | null>(null);
  const teaserSoundPlayedRef = useRef(false);
  const pendingTeaserSoundRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => getOrCreateChatSessionId());
  // Teasers sync after mount (sessionStorage) via layout effect so first paint is still immediate.
  const [teasersVisible, setTeasersVisible] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [badgeCleared, setBadgeCleared] = useState(false);

  const quickReplies = tv<QuickReply[]>("chatbot.quickReplies");
  const teaserMessages = tv<string[]>("chatbot.teasers") ?? [];
  const showQuickReplies = messages.length === 0 && !sending;
  const showTeasers = !open && !teaserDismissed && teasersVisible && teaserMessages.length > 0;
  // After teaser bubbles hide, keep "2" on the FAB until the visitor opens chat.
  const showAttentionBadge =
    !open && !badgeCleared && teaserDismissed && teaserMessages.length > 0;

  useLayoutEffect(() => {
    if (hasClearedChatBadge()) {
      setTeaserDismissed(true);
      setBadgeCleared(true);
      return;
    }
    if (hasSeenChatTeasers()) {
      // Bubbles already played this session — show badge until chat is opened.
      setTeaserDismissed(true);
      return;
    }
    setTeasersVisible(true);
  }, []);

  // Browsers block autoplay: unlock AudioContext on first gesture, then play pending chime.
  useEffect(() => {
    const tryUnlockAndPlay = () => {
      void (async () => {
        const ctx = getMessageAudioContext();
        if (ctx?.state === "suspended") {
          try {
            await ctx.resume();
          } catch {
            // ignore
          }
        }
        if (!pendingTeaserSoundRef.current || teaserSoundPlayedRef.current) return;
        if (await playMessagePopSound()) {
          teaserSoundPlayedRef.current = true;
          pendingTeaserSoundRef.current = false;
        }
      })();
    };

    const opts: AddEventListenerOptions = { capture: true };
    window.addEventListener("pointerdown", tryUnlockAndPlay, opts);
    window.addEventListener("touchstart", tryUnlockAndPlay, opts);
    window.addEventListener("keydown", tryUnlockAndPlay, opts);
    return () => {
      window.removeEventListener("pointerdown", tryUnlockAndPlay, opts);
      window.removeEventListener("touchstart", tryUnlockAndPlay, opts);
      window.removeEventListener("keydown", tryUnlockAndPlay, opts);
    };
  }, []);

  // Fire (or queue) attention chime when teaser bubbles appear.
  useEffect(() => {
    if (!teasersVisible || teaserDismissed || open || teaserSoundPlayedRef.current) return;
    pendingTeaserSoundRef.current = true;

    let cancelled = false;
    void (async () => {
      await new Promise((r) => window.setTimeout(r, 120));
      if (cancelled || teaserSoundPlayedRef.current) return;
      if (await playMessagePopSound()) {
        teaserSoundPlayedRef.current = true;
        pendingTeaserSoundRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teasersVisible, teaserDismissed, open]);

  // Keep welcome bubbles ~6s, then leave the "2" badge until chat opens.
  useEffect(() => {
    if (!teasersVisible || teaserDismissed || open) return;
    const timer = window.setTimeout(() => {
      markChatTeasersSeen();
      setTeasersVisible(false);
      setTeaserDismissed(true);
      pendingTeaserSoundRef.current = false;
    }, 6_000);
    return () => window.clearTimeout(timer);
  }, [teasersVisible, teaserDismissed, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      if (!isPhoneLikeViewport()) {
        window.setTimeout(() => inputRef.current?.focus(), 120);
      }
    }
  }, [open]);

  useEffect(() => {
    if (isPhoneLikeViewport()) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    if (stickToBottomRef.current) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages, sending, scrollToBottom]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 72;
  };

  const resolveErrorMessage = useCallback(
    (code: ChatErrorCode): string => {
      if (code === "RATE_LIMIT") return t("chatbot.rateLimit");
      return t("chatbot.error");
    },
    [t],
  );

  const submitMessage = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || sending || message.length > CHATBOT_MAX_MESSAGE_LENGTH) return;

      lastUserMessageRef.current = message;
      stickToBottomRef.current = true;

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const historyBeforeSend = toHistory(messages);
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setSending(true);

      try {
        const response = await sendChatbotMessage({
          data: {
            message,
            language,
            sessionId,
            history: historyBeforeSend,
          },
        });

        if (response.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: "assistant",
              content: response.reply,
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId(),
              role: "assistant",
              content: resolveErrorMessage(response.code),
              timestamp: new Date(),
              error: true,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: t("chatbot.error"),
            timestamp: new Date(),
            error: true,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [language, messages, resolveErrorMessage, sending, sessionId, t],
  );

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    void submitMessage(input);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleRetry = () => {
    if (lastUserMessageRef.current) {
      void submitMessage(lastUserMessageRef.current);
    }
  };

  // Take former WhatsApp FAB corner so AI is the primary contact affordance.
  const cornerPosition = isRTL
    ? "right-4 sm:right-7 items-end"
    : "left-4 sm:left-7 items-start";

  const openChat = () => {
    markChatTeasersSeen();
    markChatBadgeCleared();
    setTeaserDismissed(true);
    setTeasersVisible(false);
    setBadgeCleared(true);
    setOpen(true);
  };

  const teaserSlideX = isRTL ? 16 : -16;

  const teaserBubbles = showTeasers ? (
    <motion.div
      key="chat-teasers"
      role="region"
      aria-label={t("chatbot.teaserAria")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      className={cn(
        "mb-0.5 flex max-w-[min(17.5rem,calc(100vw-5.75rem))] flex-col gap-2",
        isRTL ? "items-end" : "items-start",
      )}
    >
      {teaserMessages.map((text, index) => (
        <motion.button
          key={`${index}-${text.slice(0, 24)}`}
          type="button"
          onClick={openChat}
          initial={{ opacity: 0, x: teaserSlideX, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.25 + index * 0.85,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            "rounded-2xl border border-navy/8 bg-white px-3.5 py-2.5 text-start text-sm leading-snug text-navy shadow-[0_10px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:border-gold/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
            isRTL ? "text-right rounded-ee-md" : "text-left rounded-es-md",
          )}
        >
          {text}
        </motion.button>
      ))}
    </motion.div>
  ) : null;

  return (
    <div
      className={cn(
        // Elevate above homepage ad ticker only; elsewhere keep a normal safe FAB offset.
        "fixed z-50 flex flex-col gap-2.5",
        isHome
          ? "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]",
        cornerPosition,
      )}
    >
      <AnimatePresence>
        {open ? (
          <motion.section
            key="chat-panel"
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex flex-col overflow-hidden rounded-[1.5rem] border border-navy/10 bg-[#f7f5f1] shadow-luxe",
              // Desktop: slender tall card beside the FAB
              "sm:w-[min(100vw-2.5rem,22.5rem)]",
              // Mobile: narrower centered column, stretch tall between nav and FAB
              "max-sm:fixed max-sm:left-1/2 max-sm:z-50 max-sm:w-[min(20rem,calc(100vw-3.5rem))] max-sm:-translate-x-1/2 max-sm:h-auto",
              isHome
                ? "max-sm:top-[calc(3.35rem+env(safe-area-inset-top))] max-sm:bottom-[calc(4.35rem+env(safe-area-inset-bottom))] sm:h-[min(40rem,calc(100dvh-8.5rem))]"
                : "max-sm:top-[calc(3.35rem+env(safe-area-inset-top))] max-sm:bottom-[calc(3.65rem+env(safe-area-inset-bottom))] sm:h-[min(40rem,calc(100dvh-7rem))]",
            )}
          >
            <header className="relative shrink-0 overflow-hidden bg-navy px-3.5 pb-3 pt-3 text-navy-foreground sm:px-4 sm:pb-3.5 sm:pt-3.5">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 120% at 100% 0%, color-mix(in oklab, var(--gold) 35%, transparent), transparent 55%), linear-gradient(165deg, color-mix(in oklab, var(--ocean) 55%, var(--navy)), var(--navy))",
                }}
                aria-hidden
              />
              <div className={cn("relative flex items-center gap-2.5 sm:gap-3", isRTL && "pe-11 sm:pe-12")}>
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-gold/50 bg-[#f4f1ea] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:size-11">
                  <img
                    src="/images/brand/chatbot-robot-avatar.png"
                    alt=""
                    width={44}
                    height={44}
                    className="size-full object-cover object-center"
                    draggable={false}
                  />
                  <span
                    className="absolute end-0 bottom-0 size-2.5 rounded-full border-2 border-navy bg-emerald-400"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="truncate font-display text-[0.98rem] leading-tight tracking-wide sm:text-[1.05rem]">
                    {t("chatbot.title")}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-gold/90 sm:text-[0.7rem]">
                    <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                    {t("chatbot.statusOnline")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    fabRef.current?.focus();
                  }}
                  aria-label={t("common.close")}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border border-white/12 bg-white/5 text-white/90 transition hover:border-gold/50 hover:bg-white/10 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:size-9",
                    isRTL && "absolute end-0 top-1/2 -translate-y-1/2",
                  )}
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" aria-hidden />
            </header>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3.5 sm:space-y-3.5 sm:px-3.5 sm:py-4"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in oklab, var(--sand) 88%, white), color-mix(in oklab, var(--sand) 55%, #eef2f6))",
              }}
              aria-live="polite"
              aria-relevant="additions"
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl border border-navy/6 bg-white/95 px-3 py-2.5 text-[0.8125rem] leading-relaxed text-navy shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:px-3.5 sm:py-3 sm:text-sm",
                  isRTL ? "ms-auto me-0 rounded-ee-md" : "me-auto ms-0 rounded-es-md",
                )}
              >
                <p className="whitespace-pre-line">{t("chatbot.welcome")}</p>
                <time
                  className="mt-1.5 block text-[0.62rem] text-navy/40 sm:mt-2 sm:text-[0.65rem]"
                  dateTime={new Date().toISOString()}
                >
                  {formatTime(new Date(), language)}
                </time>
              </div>

              {showQuickReplies ? (
                <div
                  className={cn(
                    "flex max-w-full flex-wrap gap-1.5 sm:max-w-[95%] sm:gap-2",
                    isRTL ? "ms-auto me-0 justify-end" : "me-auto ms-0 justify-start",
                  )}
                >
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.label}
                      type="button"
                      onClick={() => void submitMessage(reply.message)}
                      className="rounded-full border border-navy/10 bg-white/80 px-2.5 py-1.5 text-[0.7rem] text-navy/85 shadow-sm backdrop-blur-sm transition hover:border-gold/55 hover:bg-gold/10 hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-3 sm:text-xs"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex max-w-[92%] flex-col gap-1",
                    message.role === "user"
                      ? isRTL
                        ? "ms-0 me-auto items-start"
                        : "me-0 ms-auto items-end"
                      : isRTL
                        ? "ms-auto me-0 items-end"
                        : "me-auto ms-0 items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2.5 text-[0.8125rem] leading-relaxed sm:px-3.5 sm:py-3 sm:text-sm",
                      message.role === "user"
                        ? "rounded-es-md bg-navy text-navy-foreground shadow-[0_10px_28px_rgba(15,23,42,0.18)]"
                        : message.error
                          ? "rounded-ee-md border border-red-200 bg-red-50 text-red-900"
                          : "rounded-ee-md border border-navy/6 bg-white/95 text-navy shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
                      message.role === "user" && isRTL && "rounded-es-2xl rounded-ee-md",
                      message.role === "assistant" && isRTL && "rounded-ee-2xl rounded-es-md",
                    )}
                  >
                    {message.role === "assistant" && !message.error ? (
                      <AssistantMessageContent content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <time
                      className="text-[0.65rem] text-navy/40"
                      dateTime={message.timestamp.toISOString()}
                    >
                      {formatTime(message.timestamp, language)}
                    </time>
                    {message.error ? (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="text-[0.65rem] font-medium text-navy underline-offset-2 hover:text-gold hover:underline"
                      >
                        {t("chatbot.retry")}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}

              {sending ? (
                <div
                  className={cn(
                    "flex max-w-[90%] items-center gap-2.5 rounded-2xl rounded-ee-md border border-navy/6 bg-white/95 px-3.5 py-3 text-sm text-navy/65 shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
                    isRTL ? "ms-auto me-0" : "me-auto ms-0",
                  )}
                  role="status"
                  aria-label={t("chatbot.typing")}
                >
                  <span className="flex items-center gap-1" aria-hidden>
                    <span className="size-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.2s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.1s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-gold" />
                  </span>
                  <span className="text-xs">{t("chatbot.typing")}…</span>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-navy/8 bg-white/90 px-2.5 py-2.5 backdrop-blur-md sm:px-3 sm:py-3"
            >
              <div className="flex items-end gap-1.5 rounded-2xl border border-navy/10 bg-[#f7f5f1] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus-within:border-gold/45 focus-within:ring-2 focus-within:ring-gold/15 sm:gap-2 sm:p-1.5">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value.slice(0, CHATBOT_MAX_MESSAGE_LENGTH))
                  }
                  onKeyDown={handleInputKeyDown}
                  placeholder={t("chatbot.placeholder")}
                  rows={1}
                  disabled={sending}
                  dir={isRTL ? "rtl" : "ltr"}
                  aria-label={t("chatbot.placeholder")}
                  className="min-h-9 max-h-28 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:ring-0 sm:min-h-10 sm:px-2.5 sm:py-2.5 sm:text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !input.trim()}
                  aria-label={t("chatbot.send")}
                  className="size-9 shrink-0 rounded-xl border border-navy/80 bg-navy text-navy-foreground transition hover:border-gold hover:bg-gold hover:text-navy disabled:opacity-40 sm:size-10"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <SendHorizontal className={cn("size-4", isRTL && "scale-x-[-1]")} />
                  )}
                </Button>
              </div>
            </form>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* dir=ltr keeps physical order: AR → bubbles left of FAB, EN → bubbles right of FAB */}
      <div className="flex flex-row items-end gap-2.5" dir="ltr">
        <AnimatePresence>{isRTL ? teaserBubbles : null}</AnimatePresence>

        <div className="relative shrink-0">
          {!open ? (
            <>
              <span
                className="pointer-events-none absolute -inset-1.5 -z-10 rounded-full bg-gold/25 blur-md animate-pulse"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -inset-2.5 -z-20 rounded-full border border-gold/35 animate-ping opacity-75 [animation-duration:2.4s]"
                aria-hidden
              />
            </>
          ) : null}

          <AnimatePresence>
            {showAttentionBadge ? (
              <motion.span
                key="teaser-badge"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className={cn(
                  "pointer-events-none absolute z-10 grid size-5 place-items-center rounded-full bg-red-500 text-[0.65rem] font-semibold text-white shadow-sm ring-2 ring-white/90",
                  isRTL ? "-top-0.5 -left-0.5" : "-top-0.5 -right-0.5",
                )}
                aria-hidden
              >
                {teaserMessages.length}
              </motion.span>
            ) : null}
          </AnimatePresence>

          {showTeasers ? (
            <span
              className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-gold/40"
              aria-hidden
            />
          ) : null}

          <motion.button
            ref={fabRef}
            type="button"
            onClick={() => {
              // Ensure chime can unlock on the same tap that opens chat.
              if (pendingTeaserSoundRef.current && !teaserSoundPlayedRef.current) {
                void playMessagePopSound().then((ok) => {
                  if (ok) {
                    teaserSoundPlayedRef.current = true;
                    pendingTeaserSoundRef.current = false;
                  }
                });
              }
              if (open) {
                setOpen(false);
                return;
              }
              openChat();
            }}
            aria-label={t("chatbot.fabLabel")}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            whileHover={{ y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative inline-flex size-12 items-center justify-center rounded-full sm:size-14",
              "border border-gold-soft bg-gold text-navy shadow-[0_12px_32px_rgba(15,23,42,0.28),0_0_0_4px_rgba(212,175,55,0.22)]",
              "transition-colors hover:bg-gold-soft hover:shadow-[0_14px_36px_rgba(15,23,42,0.32),0_0_0_5px_rgba(212,175,55,0.28)]",
              "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-navy",
              open && "max-sm:hidden",
              open && "border-navy/15 bg-navy text-navy-foreground shadow-luxe hover:border-gold hover:bg-gold hover:text-navy",
            )}
          >
            {open ? (
              <X className="size-6" strokeWidth={1.6} aria-hidden />
            ) : (
              <Bot className="size-6" strokeWidth={1.75} aria-hidden />
            )}
          </motion.button>
        </div>

        <AnimatePresence>{!isRTL ? teaserBubbles : null}</AnimatePresence>
      </div>
    </div>
  );
}
