import type { ChatSource } from "../../Models/Chat"

export type ChatMessage = {
  id: number
  role: "user" | "assistant"
  content: string
  sources?: ChatSource[]
  suggestions?: string[]
  error?: boolean
}

export type ChatConversation = {
  id: string
  title: string
  updatedAt: number
  messages: ChatMessage[]
}

export type ChatHistoryState = {
  activeId: string
  conversations: ChatConversation[]
}

const HISTORY_STORAGE_KEY = "dolfin.chat.history.v1"
const LEGACY_STORAGE_KEY = "dolfin.chat.messages"
const MAX_CONVERSATIONS = 12
const MAX_MESSAGES = 50

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const createEmptyConversation = (): ChatConversation => ({
  id: makeId(),
  title: "",
  updatedAt: Date.now(),
  messages: [],
})

const isSource = (source: unknown): source is ChatSource =>
  typeof source === "object" &&
  source !== null &&
  "title" in source &&
  "path" in source &&
  typeof source.title === "string" &&
  typeof source.path === "string" &&
  source.path.startsWith("/")

const readMessages = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (message): message is Omit<ChatMessage, "id"> =>
        typeof message === "object" &&
        message !== null &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.length > 0 &&
        message.content.length <= 4000 &&
        (message.sources === undefined ||
          (Array.isArray(message.sources) && message.sources.every(isSource))) &&
        (message.suggestions === undefined ||
          (Array.isArray(message.suggestions) &&
            message.suggestions.every(
              (suggestion: unknown) => typeof suggestion === "string" && suggestion.length <= 200,
            ))),
    )
    .slice(-MAX_MESSAGES)
    .map((message, index) => ({ ...message, id: index + 1 }))
}

const titleFrom = (messages: ChatMessage[]) =>
  messages.find((message) => message.role === "user")?.content.slice(0, 48) ?? ""

export const readChatHistory = (): ChatHistoryState => {
  try {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "activeId" in parsed &&
        "conversations" in parsed &&
        typeof parsed.activeId === "string" &&
        Array.isArray(parsed.conversations)
      ) {
        const conversations = parsed.conversations
          .filter(
            (conversation: unknown) =>
              typeof conversation === "object" &&
              conversation !== null &&
              "id" in conversation &&
              "messages" in conversation &&
              typeof conversation.id === "string",
          )
          .map((conversation) => {
            const messages = readMessages(conversation.messages)
            return {
              id: conversation.id,
              title: titleFrom(messages),
              updatedAt:
                "updatedAt" in conversation && typeof conversation.updatedAt === "number"
                  ? conversation.updatedAt
                  : Date.now(),
              messages,
            }
          })
          .slice(-MAX_CONVERSATIONS)

        if (conversations.length > 0) {
          return {
            activeId: conversations.some(({ id }) => id === parsed.activeId)
              ? parsed.activeId
              : conversations.at(-1)!.id,
            conversations,
          }
        }
      }
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const legacyMessages = legacy ? readMessages(JSON.parse(legacy)) : []
    const conversation = createEmptyConversation()
    conversation.messages = legacyMessages
    conversation.title = titleFrom(legacyMessages)
    return { activeId: conversation.id, conversations: [conversation] }
  } catch {
    const conversation = createEmptyConversation()
    return { activeId: conversation.id, conversations: [conversation] }
  }
}

export const writeChatHistory = (state: ChatHistoryState) => {
  try {
    const conversations = state.conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages
        .filter((message) => !message.error)
        .slice(-MAX_MESSAGES)
        .map(({ role, content, sources, suggestions }) => ({
          role,
          content,
          ...(sources && sources.length > 0 ? { sources } : {}),
          ...(suggestions && suggestions.length > 0 ? { suggestions } : {}),
        })),
    }))

    if (conversations.every(({ messages }) => messages.length === 0)) {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY)
    } else {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify({ ...state, conversations }),
      )
    }
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Chat remains usable when storage is unavailable or full.
  }
}

export const replaceActiveMessages = (
  state: ChatHistoryState,
  update: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
): ChatHistoryState => ({
  ...state,
  conversations: state.conversations.map((conversation) => {
    if (conversation.id !== state.activeId) return conversation
    const messages = typeof update === "function" ? update(conversation.messages) : update
    return {
      ...conversation,
      messages,
      title: titleFrom(messages),
      updatedAt: Date.now(),
    }
  }),
})

export const addConversation = (state: ChatHistoryState): ChatHistoryState => {
  const active = state.conversations.find(({ id }) => id === state.activeId)
  if (active && active.messages.length === 0) return state

  const conversation = createEmptyConversation()
  return {
    activeId: conversation.id,
    conversations: [...state.conversations, conversation].slice(-MAX_CONVERSATIONS),
  }
}

export const clearChatHistory = (): ChatHistoryState => {
  const conversation = createEmptyConversation()
  return { activeId: conversation.id, conversations: [conversation] }
}
