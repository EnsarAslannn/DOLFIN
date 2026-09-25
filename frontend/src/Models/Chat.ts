export type ChatSource = {
  title: string
  path: string
}

export type ChatTurn = {
  role: "user" | "assistant"
  content: string
}

export type ChatPageContext = {
  currentPath: string
  currentSymbol?: string
}

export type ChatResponse = {
  answer: string
  sources: ChatSource[]
  usedAi: boolean
  suggestions?: string[]
}
