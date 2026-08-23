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
