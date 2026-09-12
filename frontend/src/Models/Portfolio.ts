export type PortfolioGet = {
  id: number
  symbol: string
  companyName: string
  purchase: number
  lastDiv: number
  industry: string
  marketCap: number
  quantity: number;
  averagePrice: number
}

export type PortfolioPost = {
  symbol: string
  quantity: number 
}

export type StockAllocation = {
  stockId: number
  symbol: string
  companyName: string
  industry: string
  quantity: number
  averageCostPerShare: number
  currentPrice: number
  currentValue: number
  gainLossAmount: number
  gainLossPercent: number
  allocationPercent: number
}

export type PortfolioMetrics = {
  totalInvestedAmount: number
  currentValue: number
  gainLossAmount: number
  gainLossPercent: number
  allocations: StockAllocation[]
}

export type TransactionType = "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW"

// Deposits and withdrawals are stored against the pseudo-symbol CASH with a
// quantity of 1, so totalAmount is the figure to render for every type.
export type Transaction = {
  id: number
  symbol: string
  companyName: string
  transactionType: TransactionType
  quantity: number
  price: number
  totalAmount: number
  timestamp: string
}

// Mirrors AllocationWarningDto. The API sends the pieces rather than a
// finished sentence so the wallet can word it in whichever language it is
// showing; `message` is the English fallback for an unrecognised code.
export type AllocationWarningCode =
  | "portfolio.warning.concentration"
  | "portfolio.warning.sector"

export type AllocationWarning = {
  code: AllocationWarningCode | string
  symbol: string | null
  industry: string | null
  percent: number
  message: string
}

export type RebalanceAction = "Buy" | "Sell" | "Hold"

export type StockAdjustment = {
  stockId: number
  symbol: string
  currentAllocationPercent: number
  targetAllocationPercent: number
  action: RebalanceAction | string
  suggestedQuantity: number
}

export type RebalancingRecommendation = {
  adjustments: StockAdjustment[]
  holdingCount: number
  targetAllocationPercent: number
  /** The API's own English summary, kept as a fallback. */
  summary: string
}
