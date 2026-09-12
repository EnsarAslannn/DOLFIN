// A session can end while the user is in the middle of something: the token
// has a fixed life, and an admin revoking it takes effect on the next request.
// handleError raises this from outside React, and the app shell listens.
//
// It used to assign window.location.href instead, which reloaded the whole
// application to reach a page the router already knows how to show -- losing
// whatever was on screen, and any half-filled form with it.
const SESSION_EXPIRED = "dolfin:session-expired"

export const notifySessionExpired = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED))
}

export const subscribeToSessionExpiry = (handler: () => void) => {
  window.addEventListener(SESSION_EXPIRED, handler)
  return () => window.removeEventListener(SESSION_EXPIRED, handler)
}
