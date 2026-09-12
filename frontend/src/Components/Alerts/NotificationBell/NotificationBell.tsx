import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  alertNotificationReadAPI,
  alertNotificationsGetAPI,
} from "../../../Services/AlertService"
import { formatRelativeTime } from "../../../Helpers/dateTime"
import { alertNotificationText } from "../../../Helpers/alertNotificationText"
import { subscribeToAlertChanges } from "../../../Helpers/alertEvents"
import { usePollWhileVisible } from "../../../Helpers/usePollWhileVisible"
import { useLanguage } from "../../../i18n/useLanguage"
import type { AlertNotification } from "../../../Models/Alert"

// Alerts are checked server-side once a minute, so polling any faster would
// only ask the same question twice before the answer can change.
const POLL_MS = 60_000

// The panel is a dropdown, not a page: past a certain depth the list stops
// being scannable, and the wallet carries the full alert history.
const VISIBLE_LIMIT = 8

type Props = {
  isLight: boolean
}

const NotificationBell = ({ isLight }: Props) => {
  const { t, language } = useLanguage()
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    const res = await alertNotificationsGetAPI()
    if (res?.data) setNotifications(res.data)
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      const res = await alertNotificationsGetAPI()
      if (active && res?.data) setNotifications(res.data)
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // Creating or removing an alert on the wallet page changes what belongs in
  // here, and that page cannot reach this component's state directly.
  useEffect(() => subscribeToAlertChanges(refresh), [refresh])

  usePollWhileVisible(refresh, POLL_MS)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const unread = notifications.filter((n) => !n.isRead)

  const markRead = async (notification: AlertNotification) => {
    if (notification.isRead) return

    // Flipped locally first so the badge answers the click straight away; the
    // refresh below is what makes it true, and a failed call simply restores
    // the unread state on the next poll.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    )
    await alertNotificationReadAPI(notification.id)
    await refresh()
  }

  const markAllRead = async () => {
    const pending = unread
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    await Promise.all(pending.map((n) => alertNotificationReadAPI(n.id)))
    await refresh()
  }

  const mutedClass = isLight ? "text-ink-muted" : "text-ash-text"
  const strongClass = isLight ? "text-onyx-canvas" : "text-ivory-text"
  const hoverClass = isLight
    ? "text-onyx-canvas hover:bg-onyx-canvas/8"
    : "text-ivory-text hover:bg-mist-border/10"
  const panelClass = isLight
    ? "border-onyx-canvas/10 bg-cream-canvas/95"
    : "border-mist-border/10 bg-graphite-card/95"

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          unread.length > 0
            ? t("bell.label.unread", { count: unread.length })
            : t("bell.label")
        }
        className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-card transition-colors duration-200 ${hoverClass}`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V5a2 2 0 1 0-4 0v.3A6 6 0 0 0 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
          />
        </svg>
        {unread.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-cobalt px-1 font-mono text-caption font-bold leading-none text-pure-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={t("bell.panel.label")}
          className={`absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border shadow-lg backdrop-blur-md ${panelClass}`}
        >
          <div
            className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
              isLight ? "border-onyx-canvas/10" : "border-mist-border/10"
            }`}
          >
            <span
              className={`font-mono text-caption font-normal uppercase tracking-label ${mutedClass}`}
            >
              {t("bell.heading")}
            </span>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="cursor-pointer text-caption font-normal text-cobalt underline-offset-4 hover:underline"
              >
                {t("bell.markAllRead")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-6">
              <p className={`text-body font-normal ${mutedClass}`}>
                {t("bell.empty")}
              </p>
              <Link
                to="/wallet"
                onClick={() => setOpen(false)}
                className="mt-2 inline-block text-caption font-normal text-cobalt underline-offset-4 hover:underline"
              >
                {t("bell.setAlert")}
              </Link>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.slice(0, VISIBLE_LIMIT).map((notification) => (
                <li
                  key={notification.id}
                  className={
                    isLight
                      ? "border-b border-onyx-canvas/8 last:border-b-0"
                      : "border-b border-mist-border/8 last:border-b-0"
                  }
                >
                  <button
                    type="button"
                    onClick={() => markRead(notification)}
                    disabled={notification.isRead}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                      notification.isRead
                        ? "cursor-default"
                        : `cursor-pointer ${
                            isLight
                              ? "hover:bg-onyx-canvas/5"
                              : "hover:bg-mist-border/8"
                          }`
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.isRead ? "bg-transparent" : "bg-cobalt"
                      }`}
                    />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span
                        className={`text-body font-normal ${
                          notification.isRead ? mutedClass : strongClass
                        }`}
                      >
                        {alertNotificationText(notification, t)}
                      </span>
                      <span
                        className={`font-mono text-caption font-normal ${mutedClass}`}
                      >
                        {formatRelativeTime(notification.createdAt, language)}
                        {notification.isRead ? "" : ` · ${t("bell.unread")}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
