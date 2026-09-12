import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { subscribeToSessionExpiry } from "../../Helpers/sessionEvents"
import { useAuth } from "../../Context/useAuth"
import { ctaBaseClass, ctaFillClass } from "../../Helpers/formStyles"
import { useLanguage } from "../../i18n/useLanguage"

/**
 * What a user sees when their session ends under them.
 *
 * A token lasts four hours and an admin can revoke one at any moment, so this
 * arrives mid-session by definition -- mid-form, mid-trade, mid-anything. The
 * app used to answer it by assigning window.location.href, reloading the whole
 * application to reach a page the router already knew and taking the screen
 * with it. This says what happened and lets the user go to the sign-in page
 * themselves, which is also the difference between an app that lost their
 * session and an app that appears to have crashed.
 */
const SessionExpired = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Held in a ref so the subscription below does not tear down and re-attach
  // every time the auth context changes identity.
  const latestUser = useRef(user)
  useEffect(() => {
    latestUser.current = user
  })

  useEffect(
    () =>
      subscribeToSessionExpiry(() => {
        // A visitor who never signed in has no session to have lost. They see
        // the sign-in page through the route guard instead, with nothing to
        // explain.
        if (!latestUser.current) return
        setIsOpen(true)
      }),
    [],
  )

  // The dialog is the only thing to act on, so it takes focus.
  useEffect(() => {
    if (isOpen) confirmRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const goToLogin = () => {
    setIsOpen(false)
    // Clears the stale user from context and routes home; the sign-in page is
    // one step from there and the app never reloads.
    logout()
    navigate("/login")
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-onyx-canvas/80 px-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-card bg-band-surface p-8 ring-1 ring-inset ring-band-line/10">
        <h2
          id="session-expired-title"
          className="text-heading-sm font-medium text-band-ink"
        >
          {t("session.expired.title")}
        </h2>
        <p className="mt-3 text-body font-normal text-band-muted">
          {t("session.expired.description")}
        </p>

        <button
          ref={confirmRef}
          type="button"
          onClick={goToLogin}
          className={`mt-6 inline-flex items-center px-6 py-3 text-body ${ctaBaseClass} ${ctaFillClass}`}
        >
          {t("session.expired.cta")}
        </button>
      </div>
    </div>
  )
}

export default SessionExpired
