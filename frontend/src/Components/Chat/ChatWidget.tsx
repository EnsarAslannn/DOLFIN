import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { LuArrowUpRight, LuMessageCircle, LuSend, LuSparkles, LuSquarePen, LuX } from "react-icons/lu"
import { askDolfin } from "../../Services/ChatService"
import { useLanguage } from "../../i18n/useLanguage"
import type { ChatSource } from "../../Models/Chat"

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
  sources?: ChatSource[]
  error?: boolean
}

const CHAT_STORAGE_KEY = "dolfin.chat.messages"
const MAX_STORED_MESSAGES = 50

const readStoredMessages = (): Message[] => {
  try {
    const stored = window.localStorage.getItem(CHAT_STORAGE_KEY)
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (message): message is Omit<Message, "id"> =>
          typeof message === "object" &&
          message !== null &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.length > 0 &&
          message.content.length <= 4000 &&
          (message.sources === undefined ||
            (Array.isArray(message.sources) &&
              message.sources.every(
                (source: unknown) =>
                  typeof source === "object" &&
                  source !== null &&
                  "title" in source &&
                  "path" in source &&
                  typeof source.title === "string" &&
                  typeof source.path === "string" &&
                  source.path.startsWith("/"),
              ))),
      )
      .slice(-MAX_STORED_MESSAGES)
      .map((message, index) => ({ ...message, id: index + 1 }))
  } catch {
    return []
  }
}

const ChatWidget = () => {
  const { language, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<Message[]>(readStoredMessages)
  const nextId = useRef(messages.length + 1)
  const conversationVersion = useRef(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const closePanel = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    inputRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isSending])

  useEffect(() => {
    try {
      const messagesToStore = messages
        .filter((message) => !message.error)
        .slice(-MAX_STORED_MESSAGES)
        .map(({ role, content, sources }) => ({
          role,
          content,
          ...(sources && sources.length > 0 ? { sources } : {}),
        }))

      if (messagesToStore.length === 0) {
        window.localStorage.removeItem(CHAT_STORAGE_KEY)
      } else {
        window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToStore))
      }
    } catch {
      // The assistant remains usable if storage is unavailable or full.
    }
  }, [messages])

  const startNewConversation = () => {
    conversationVersion.current += 1
    setMessages([])
    setInput("")
    setIsSending(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const send = async (event?: FormEvent) => {
    event?.preventDefault()
    const question = input.trim()
    if (!question || isSending) return

    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      content: question,
    }
    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsSending(true)
    const activeConversation = conversationVersion.current

    try {
      const history = messages
        .filter((message) => !message.error)
        .slice(-8)
        .map(({ role, content }) => ({ role, content }))
      const response = await askDolfin(question, language, history)
      if (activeConversation !== conversationVersion.current) return
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ])
    } catch {
      if (activeConversation !== conversationVersion.current) return
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          content: t("chat.error"),
          error: true,
        },
      ])
    } finally {
      if (activeConversation === conversationVersion.current) {
        setIsSending(false)
      }
    }
  }

  const askSuggestion = (question: string) => {
    setInput(question)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          role="dialog"
          aria-label={t("chat.title")}
          className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-block border border-mist-border/12 bg-graphite-card shadow-2xl shadow-black/45"
        >
          <header className="relative overflow-hidden border-b border-mist-border/10 px-5 pb-4 pt-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cobalt to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-icon bg-cobalt text-pure-white">
                  <LuSparkles className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-graphite-card bg-gain" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-subheading font-medium text-ivory-text">
                    {t("chat.title")}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-caption uppercase tracking-label-sm text-ash-text">
                    <span className="h-1 w-5 rounded-pill bg-cobalt" aria-hidden="true" />
                    {t("chat.status")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={startNewConversation}
                  aria-label={t("chat.new")}
                  title={t("chat.new")}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-icon text-ash-text transition-colors hover:bg-obsidian-button hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  <LuSquarePen className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label={t("chat.close")}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-icon text-ash-text transition-colors hover:bg-obsidian-button hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  <LuX className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
            <div className="mr-8 rounded-card rounded-tl-smallcard bg-obsidian-button px-4 py-3 text-body text-ivory-text">
              {t("chat.intro")}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {[t("chat.suggestion.portfolio"), t("chat.suggestion.data")].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => askSuggestion(suggestion)}
                    className="cursor-pointer rounded-pill border border-mist-border/15 px-3 py-2 text-left text-label text-ash-text transition-colors hover:border-cobalt/60 hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[88%] rounded-card px-4 py-3 text-body ${
                  message.role === "user"
                    ? "ml-auto rounded-tr-smallcard bg-cobalt text-pure-white"
                    : `mr-auto rounded-tl-smallcard ${
                        message.error
                          ? "border border-loss/30 bg-loss/10 text-ivory-text"
                          : "bg-obsidian-button text-ivory-text"
                      }`
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 border-t border-mist-border/10 pt-2.5">
                    <p className="mb-1.5 font-mono text-caption uppercase tracking-label-sm text-ash-text">
                      {t("chat.source")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <a
                          key={`${source.path}-${source.title}`}
                          href={source.path}
                          className="inline-flex items-center gap-1 text-label text-ash-text underline decoration-mist-border/25 underline-offset-4 transition-colors hover:text-pure-white"
                        >
                          {source.title}
                          <LuArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}

            {isSending && (
              <div role="status" className="mr-8 flex items-center gap-2 rounded-card rounded-tl-smallcard bg-obsidian-button px-4 py-3 text-body text-ash-text">
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-cobalt motion-reduce:animate-none"
                      style={{ animationDelay: `${index * 140}ms` }}
                    />
                  ))}
                </span>
                {t("chat.thinking")}
              </div>
            )}
          </div>

          <form onSubmit={send} className="border-t border-mist-border/10 bg-onyx-canvas/55 p-3">
            <div className="flex items-end gap-2 rounded-card border border-mist-border/15 bg-graphite-card p-2 focus-within:border-cobalt/70">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 1000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void send()
                  }
                }}
                aria-label={t("chat.input")}
                placeholder={t("chat.placeholder")}
                rows={1}
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-body text-ivory-text outline-none placeholder:text-ash-text/55"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label={t("chat.send")}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-icon bg-cobalt text-pure-white transition-[transform,opacity] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              >
                <LuSend className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-center font-mono text-caption text-ash-text/65">
              {t("chat.disclaimer")}
            </p>
          </form>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? t("chat.close") : t("chat.open")}
        className="ml-auto flex h-14 items-center gap-2.5 rounded-pill border border-mist-border/15 bg-graphite-card px-4 text-ivory-text shadow-xl shadow-black/30 transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-obsidian-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt motion-reduce:transform-none"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cobalt text-pure-white">
          <LuMessageCircle className="h-[17px] w-[17px]" aria-hidden="true" />
          {!isOpen && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-graphite-card bg-gain" />}
        </span>
        <span className="hidden text-label font-medium sm:inline">{t("chat.title")}</span>
      </button>
    </div>
  )
}

export default ChatWidget
