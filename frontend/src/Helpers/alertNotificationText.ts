import type { Translate } from "../i18n"
import type { AlertNotification } from "../Models/Alert"

/**
 * Writes an alert notification as a sentence in the reader's language.
 *
 * The API stores one at trigger time too, but it composes it in English and
 * writes it to the database, so it can never be anything else. The structured
 * fields alongside it -- the symbol, the target, the price that actually fired
 * -- are there so the client can say the same thing in whichever language it
 * is showing.
 *
 * Notifications written before those fields existed have no symbol, and there
 * is nothing to compose from; those fall back to the stored English sentence
 * rather than rendering a line with holes in it.
 */
export const alertNotificationText = (
  notification: AlertNotification,
  t: Translate,
): string => {
  const { symbol, targetPrice, triggeredPrice, condition } = notification

  if (!symbol) return notification.message

  const target = targetPrice.toFixed(2)

  // The price that fired is what makes the sentence worth reading -- a walk
  // can jump well past the target. Without it there is only the target to
  // report.
  if (triggeredPrice == null) {
    return t("alerts.notification.triggered", { symbol, target })
  }

  const price = triggeredPrice.toFixed(2)
  const key =
    condition === "LessThanOrEqual"
      ? "alerts.notification.fell"
      : "alerts.notification.rose"

  return t(key, { symbol, price, target })
}
