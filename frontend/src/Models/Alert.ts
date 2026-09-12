// Mirrors PriceAlertDto / AlertNotificationDto on the API. The condition is
// serialised as the .NET enum name rather than a symbol, so the string values
// have to match PriceAlertCondition exactly.
export type PriceAlertCondition = "GreaterThanOrEqual" | "LessThanOrEqual"

export type PriceAlert = {
  id: number
  stockId: number
  symbol: string
  targetPrice: number
  condition: PriceAlertCondition
  isActive: boolean
  triggeredAt: string | null
  /** The price that fired the alert; null while it is still pending. */
  triggeredPrice: number | null
  createdAt: string
}

export type AlertNotification = {
  id: number
  priceAlertId: number
  /**
   * The API's own sentence, composed in English at trigger time and written to
   * the database. Kept as the fallback for rows stored before the fields below
   * existed.
   */
  message: string
  /**
   * The alert this notification came from, as data rather than as prose, so
   * the sentence can be written in whichever language the app is showing.
   */
  symbol: string
  condition: PriceAlertCondition
  targetPrice: number
  triggeredPrice: number | null
  isRead: boolean
  createdAt: string
}
