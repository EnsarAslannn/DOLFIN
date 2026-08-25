// A timestamp the API could not parse renders as a dash rather than the
// string "Invalid Date", which would otherwise leak into the UI.
export const formatTimestamp = (timestamp: string) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return "—"

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Alerts fire on a one-minute cadence, so "just now" and "12m ago" carry more
// information in a notification list than a full date does.
export const formatRelativeTime = (timestamp: string, now: number = Date.now()) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return "—"

  const elapsed = now - parsed.getTime()
  if (elapsed < 0 || elapsed < MINUTE) return "just now"
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`

  return formatTimestamp(timestamp)
}
