import { DEFAULT_LANGUAGE, type Language } from "../i18n/types"
import { translate } from "../i18n/translate"

const LOCALES: Record<Language, string> = {
  tr: "tr-TR",
  en: "en-US",
}

// A timestamp the API could not parse renders as a dash rather than the
// string "Invalid Date", which would otherwise leak into the UI.
export const formatTimestamp = (
  timestamp: string,
  lang: Language = DEFAULT_LANGUAGE,
) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return "—"

  return parsed.toLocaleString(LOCALES[lang], {
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
export const formatRelativeTime = (
  timestamp: string,
  lang: Language = DEFAULT_LANGUAGE,
  now: number = Date.now(),
) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return "—"

  const elapsed = now - parsed.getTime()
  if (elapsed < 0 || elapsed < MINUTE) return translate(lang, "time.justNow")
  if (elapsed < HOUR)
    return translate(lang, "time.minutesAgo", {
      count: Math.floor(elapsed / MINUTE),
    })
  if (elapsed < DAY)
    return translate(lang, "time.hoursAgo", { count: Math.floor(elapsed / HOUR) })
  if (elapsed < 7 * DAY)
    return translate(lang, "time.daysAgo", { count: Math.floor(elapsed / DAY) })

  return formatTimestamp(timestamp, lang)
}
