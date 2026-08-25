// The notification bell lives in the navbar and the alert list lives on the
// wallet page, so neither can hold the other's state. Creating or removing an
// alert changes what the bell should show, and a browser event is the shortest
// path between two components that share only the document.
const ALERTS_CHANGED = "dolfin:alerts-changed"

export const notifyAlertsChanged = () => {
  window.dispatchEvent(new Event(ALERTS_CHANGED))
}

export const subscribeToAlertChanges = (handler: () => void) => {
  window.addEventListener(ALERTS_CHANGED, handler)
  return () => window.removeEventListener(ALERTS_CHANGED, handler)
}
