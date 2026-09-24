import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { LuArrowUpRight, LuHistory, LuMessageCircle, LuSend, LuSparkles, LuSquarePen, LuTrash2, LuX } from "react-icons/lu"
import { askDolfin } from "../../Services/ChatService"
import { portfolioAddAPI, portfolioGetAPI, portfolioSellAPI } from "../../Services/PortfolioService"
import { searchStocksBySymbolAPI } from "../../Services/StockService"
import { useAuth } from "../../Context/useAuth"
import { useLanguage } from "../../i18n/useLanguage"
import {
  addConversation,
  clearChatHistory,
  readChatHistory,
  replaceActiveMessages,
  writeChatHistory,
  type ChatMessage as Message,
} from "./chatHistory"

const EMPTY_MESSAGES: Message[] = []

const ChatWidget = () => {
  const { language, t } = useLanguage()
  const { user, updateWalletBalance } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [history, setHistory] = useState(readChatHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showTrade, setShowTrade] = useState(false)
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY")
  const [tradeSymbol, setTradeSymbol] = useState("")
  const [tradeQuantity, setTradeQuantity] = useState(1)
  const [tradeError, setTradeError] = useState("")
  const [isTradeLoading, setIsTradeLoading] = useState(false)
  const [tradePreview, setTradePreview] = useState<{
    side: "BUY" | "SELL"
    symbol: string
    quantity: number
    price: number
  } | null>(null)
  const messages = history.conversations.find(({ id }) => id === history.activeId)?.messages ?? EMPTY_MESSAGES
  const nextId = useRef(
    Math.max(0, ...history.conversations.flatMap((conversation) => conversation.messages.map(({ id }) => id))) + 1,
  )
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
    writeChatHistory(history)
  }, [history])

  const setMessages = (update: Message[] | ((current: Message[]) => Message[])) => {
    setHistory((current) => replaceActiveMessages(current, update))
  }

  const startNewConversation = () => {
    conversationVersion.current += 1
    setHistory((current) => addConversation(current))
    setInput("")
    setIsSending(false)
    setShowHistory(false)
    setConfirmClear(false)
    setShowTrade(false)
    setTradePreview(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const selectConversation = (id: string) => {
    conversationVersion.current += 1
    setHistory((current) => ({ ...current, activeId: id }))
    setInput("")
    setIsSending(false)
    setShowHistory(false)
    setConfirmClear(false)
    setShowTrade(false)
    setTradePreview(null)
  }

  const clearAllConversations = () => {
    conversationVersion.current += 1
    setHistory(clearChatHistory())
    setInput("")
    setIsSending(false)
    setShowHistory(false)
    setConfirmClear(false)
    setShowTrade(false)
    setTradePreview(null)
  }

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)

  const appendAssistantMessage = (content: string, path = "/wallet") => {
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role: "assistant",
        content,
        sources: [{ title: t("chat.account.source"), path }],
      },
    ])
  }

  const showPortfolio = async () => {
    setShowTrade(false)
    if (!user) {
      appendAssistantMessage(t("chat.account.signIn"), "/login")
      return
    }

    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", content: t("chat.action.portfolio") },
    ])
    setIsSending(true)
    const activeConversation = conversationVersion.current
    const response = await portfolioGetAPI()
    if (activeConversation !== conversationVersion.current) return

    if (!response) {
      appendAssistantMessage(t("chat.account.error"))
      setIsSending(false)
      return
    }

    const positions = response.data
    const positionLines = positions.map(
      (position) =>
        `${position.symbol}: ${position.quantity} ${t("chat.account.shares")} / ${t("chat.account.currentValue")}: ${money(position.purchase * position.quantity)}`,
    )
    const totalValue = positions.reduce(
      (sum, position) => sum + position.purchase * position.quantity,
      0,
    )
    appendAssistantMessage(
      positions.length > 0
        ? `${t("chat.account.portfolioHeading")}\n${positionLines.join("\n")}\n${t("chat.account.totalValue")}: ${money(totalValue)}\n${t("chat.account.balance")}: ${money(user.walletBalance)}`
        : `${t("chat.account.empty")}\n${t("chat.account.balance")}: ${money(user.walletBalance)}`,
    )
    setIsSending(false)
  }

  const openTrade = () => {
    if (!user) {
      appendAssistantMessage(t("chat.account.signIn"), "/login")
      return
    }
    setShowTrade(true)
    setTradePreview(null)
    setTradeError("")
    requestAnimationFrame(() => inputRef.current?.blur())
  }

  const previewTrade = async (event: FormEvent) => {
    event.preventDefault()
    const symbol = tradeSymbol.trim().toUpperCase()
    if (!symbol || tradeQuantity < 1) {
      setTradeError(t("chat.trade.invalid"))
      return
    }

    setTradeError("")
    setTradePreview(null)
    setIsTradeLoading(true)

    try {
      const stockResponse = await searchStocksBySymbolAPI(symbol)
      const stock = stockResponse.data.find(
        (item) => (item.symbol ?? item.Symbol ?? "").toUpperCase() === symbol,
      )
      const price = stock?.purchase ?? stock?.Purchase
      if (!stock || typeof price !== "number") {
        setTradeError(t("chat.trade.notFound"))
        return
      }

      if (tradeSide === "SELL") {
        const portfolio = await portfolioGetAPI()
        const held = portfolio?.data.find((position) => position.symbol.toUpperCase() === symbol)?.quantity ?? 0
        if (held < tradeQuantity) {
          setTradeError(t("chat.trade.notEnoughShares"))
          return
        }
      }

      setTradePreview({ side: tradeSide, symbol, quantity: tradeQuantity, price })
    } catch {
      setTradePreview(null)
      setTradeError(t("chat.trade.error"))
    } finally {
      setIsTradeLoading(false)
    }
  }

  const confirmTrade = async () => {
    if (!tradePreview) return
    setIsTradeLoading(true)
    setTradeError("")

    try {
      const response =
        tradePreview.side === "BUY"
          ? await portfolioAddAPI(tradePreview.symbol, tradePreview.quantity)
          : await portfolioSellAPI(tradePreview.symbol, tradePreview.quantity)
      if (!response) {
        setTradeError(t("chat.trade.error"))
        return
      }

      updateWalletBalance(response.data.newBalance)
      const action =
        tradePreview.side === "BUY" ? t("chat.trade.bought") : t("chat.trade.sold")
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "user",
          content: `${tradePreview.symbol} / ${tradePreview.quantity} / ${tradePreview.side}`,
        },
        {
          id: nextId.current++,
          role: "assistant",
          content: `${tradePreview.quantity} ${t("chat.account.shares")} ${tradePreview.symbol} ${action}.\n${t("chat.account.balance")}: ${money(response.data.newBalance)}`,
          sources: [{ title: t("chat.account.source"), path: "/wallet" }],
        },
      ])
      setShowTrade(false)
      setTradePreview(null)
      setTradeSymbol("")
      setTradeQuantity(1)
    } catch {
      setTradeError(t("chat.trade.error"))
    } finally {
      setIsTradeLoading(false)
    }
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
          suggestions: response.suggestions,
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
    if (question === t("chat.action.portfolio")) {
      void showPortfolio()
      return
    }
    if (
      question === t("chat.action.trade") ||
      question.toLocaleLowerCase(language).includes(t("chat.action.tradeKeyword").toLocaleLowerCase(language))
    ) {
      openTrade()
      return
    }
    setInput(question)
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
                  onClick={() => {
                    setShowHistory((current) => !current)
                    setConfirmClear(false)
                  }}
                  aria-label={t("chat.history")}
                  aria-pressed={showHistory}
                  title={t("chat.history")}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-icon text-ash-text transition-colors hover:bg-obsidian-button hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  <LuHistory className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
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
            {showHistory ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-subheading font-medium text-ivory-text">{t("chat.history")}</h3>
                  <p className="mt-1 text-label text-ash-text">{t("chat.history.description")}</p>
                </div>

                <div className="space-y-2">
                  {history.conversations
                    .filter((conversation) => conversation.messages.length > 0)
                    .sort((left, right) => right.updatedAt - left.updatedAt)
                    .map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => selectConversation(conversation.id)}
                        aria-label={conversation.title}
                        aria-current={conversation.id === history.activeId ? "true" : undefined}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card border border-mist-border/12 bg-obsidian-button px-3 py-3 text-left text-label text-ivory-text transition-colors hover:border-cobalt/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        <span className="min-w-0 truncate">{conversation.title}</span>
                        <span aria-hidden="true" className="shrink-0 font-mono text-caption text-ash-text">
                          {conversation.messages.length}
                        </span>
                      </button>
                    ))}
                </div>

                {confirmClear ? (
                  <div className="rounded-card border border-loss/25 bg-loss/10 p-3">
                    <p className="text-label text-ivory-text">{t("chat.clear.confirmation")}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={clearAllConversations}
                        className="cursor-pointer rounded-pill bg-loss px-3 py-2 text-label font-medium text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-loss"
                      >
                        {t("chat.clear.confirm")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="cursor-pointer rounded-pill border border-mist-border/15 px-3 py-2 text-label text-ash-text hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        {t("chat.clear.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    disabled={history.conversations.every(({ messages: items }) => items.length === 0)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-pill px-3 py-2 text-label text-loss transition-colors hover:bg-loss/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-loss"
                  >
                    <LuTrash2 className="h-4 w-4" aria-hidden="true" />
                    {t("chat.clear.all")}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mr-8 rounded-card rounded-tl-smallcard bg-obsidian-button px-4 py-3 text-body text-ivory-text">
                  {t("chat.intro")}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[t("chat.action.portfolio"), t("chat.action.trade")].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => askSuggestion(suggestion)}
                      className="cursor-pointer rounded-pill border border-cobalt/35 px-3 py-2 text-left text-label text-ivory-text transition-colors hover:border-cobalt hover:bg-cobalt/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                    >
                      {suggestion}
                    </button>
                  ))}
                  {messages.length === 0 &&
                    [
                      t("chat.suggestion.portfolio"),
                      t("chat.suggestion.help"),
                      t("chat.suggestion.data"),
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInput(suggestion)}
                        className="cursor-pointer rounded-pill border border-mist-border/15 px-3 py-2 text-left text-label text-ash-text transition-colors hover:border-cobalt/60 hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>

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
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-mist-border/10 pt-2.5">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => askSuggestion(suggestion)}
                        className="cursor-pointer rounded-pill border border-cobalt/30 px-2.5 py-1.5 text-left text-caption text-ash-text transition-colors hover:border-cobalt hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        {suggestion}
                      </button>
                    ))}
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

                {showTrade && (
                  <form
                    onSubmit={previewTrade}
                    className="rounded-card border border-cobalt/25 bg-obsidian-button p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-subheading font-medium text-ivory-text">
                          {t("chat.trade.title")}
                        </h3>
                        <p className="mt-1 text-label text-ash-text">{t("chat.trade.disclosure")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTrade(false)
                          setTradePreview(null)
                          setTradeError("")
                        }}
                        aria-label={t("chat.trade.close")}
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-icon text-ash-text hover:bg-graphite-card hover:text-pure-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        <LuX className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="text-label text-ash-text">
                        <span className="mb-1.5 block">{t("chat.trade.side")}</span>
                        <select
                          value={tradeSide}
                          onChange={(event) => {
                            setTradeSide(event.target.value as "BUY" | "SELL")
                            setTradePreview(null)
                          }}
                          aria-label={t("chat.trade.side")}
                          className="h-10 w-full rounded-smallcard border border-mist-border/15 bg-graphite-card px-3 text-ivory-text outline-none focus:border-cobalt"
                        >
                          <option value="BUY">{t("chat.trade.buy")}</option>
                          <option value="SELL">{t("chat.trade.sell")}</option>
                        </select>
                      </label>
                      <label className="text-label text-ash-text">
                        <span className="mb-1.5 block">{t("chat.trade.quantity")}</span>
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={tradeQuantity}
                          onChange={(event) => {
                            setTradeQuantity(Number(event.target.value))
                            setTradePreview(null)
                          }}
                          aria-label={t("chat.trade.quantity")}
                          className="h-10 w-full rounded-smallcard border border-mist-border/15 bg-graphite-card px-3 text-ivory-text outline-none focus:border-cobalt"
                        />
                      </label>
                    </div>

                    <label className="mt-3 block text-label text-ash-text">
                      <span className="mb-1.5 block">{t("chat.trade.symbol")}</span>
                      <input
                        type="text"
                        value={tradeSymbol}
                        onChange={(event) => {
                          setTradeSymbol(event.target.value.toUpperCase().slice(0, 10))
                          setTradePreview(null)
                        }}
                        aria-label={t("chat.trade.symbol")}
                        placeholder="AAPL"
                        autoComplete="off"
                        className="h-10 w-full rounded-smallcard border border-mist-border/15 bg-graphite-card px-3 font-mono uppercase text-ivory-text outline-none placeholder:text-ash-text/45 focus:border-cobalt"
                      />
                    </label>

                    {tradeError && (
                      <p role="alert" className="mt-3 text-label text-loss">
                        {tradeError}
                      </p>
                    )}

                    {tradePreview ? (
                      <div className="mt-4 rounded-smallcard border border-mist-border/12 bg-graphite-card p-3">
                        <p className="font-mono text-label text-ivory-text">
                          {t("chat.trade.estimatedTotal")}: {money(tradePreview.price * tradePreview.quantity)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void confirmTrade()}
                            disabled={isTradeLoading}
                            className="cursor-pointer rounded-pill bg-cobalt px-3 py-2 text-label font-medium text-pure-white disabled:cursor-wait disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                          >
                            {t(
                              tradePreview.side === "BUY"
                                ? "chat.trade.confirmBuy"
                                : "chat.trade.confirmSell",
                              { quantity: tradePreview.quantity, symbol: tradePreview.symbol },
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTradePreview(null)}
                            disabled={isTradeLoading}
                            className="cursor-pointer rounded-pill border border-mist-border/15 px-3 py-2 text-label text-ash-text hover:text-pure-white disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                          >
                            {t("chat.trade.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isTradeLoading}
                        className="mt-4 w-full cursor-pointer rounded-pill bg-cobalt px-3 py-2.5 text-label font-medium text-pure-white disabled:cursor-wait disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        {isTradeLoading ? t("chat.trade.checking") : t("chat.trade.preview")}
                      </button>
                    )}
                  </form>
                )}
              </>
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
