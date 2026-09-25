import axiosInstance from "../Helpers/AxiosInstance"
import type { Language } from "../i18n/types"
import type { ChatPageContext, ChatResponse, ChatTurn } from "../Models/Chat"

export const askDolfin = async (
  message: string,
  language: Language,
  history: ChatTurn[],
  pageContext: ChatPageContext,
): Promise<ChatResponse> => {
  const response = await axiosInstance.post<ChatResponse>("chat", {
    message,
    language,
    history,
    ...pageContext,
  })

  return response.data
}
