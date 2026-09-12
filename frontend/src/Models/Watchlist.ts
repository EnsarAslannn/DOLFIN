// Mirrors WatchlistItemDto. Following a stock says nothing about owning it --
// it is the list for a company you are still forming an opinion about, where a
// price alert needs a level and a direction decided up front.
export type WatchlistItem = {
  id: number
  stockId: number
  symbol: string
  companyName: string
  industry: string
  /** The stock's price now, so the list is worth looking at. */
  purchase: number
  createdAt: string
}
