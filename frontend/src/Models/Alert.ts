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
  createdAt: string
}

export type AlertNotification = {
  id: number
  priceAlertId: number
  message: string
  isRead: boolean
  createdAt: string
}
