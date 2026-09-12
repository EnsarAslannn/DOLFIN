// Following happens on the search page and the list lives on the wallet, so
// neither holds the other's state. Same shape as alertEvents, and for the same
// reason: a browser event is the shortest path between two components that
// share only the document.
const WATCHLIST_CHANGED = "dolfin:watchlist-changed"

export const notifyWatchlistChanged = () => {
  window.dispatchEvent(new Event(WATCHLIST_CHANGED))
}

export const subscribeToWatchlistChanges = (handler: () => void) => {
  window.addEventListener(WATCHLIST_CHANGED, handler)
  return () => window.removeEventListener(WATCHLIST_CHANGED, handler)
}
