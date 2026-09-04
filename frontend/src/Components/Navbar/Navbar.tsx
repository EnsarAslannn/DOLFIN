import { useEffect, useId, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import logo from "../../assets/dolphin.png"
import { useAuth } from "../../Context/useAuth"
import { contentClass } from "../../Helpers/layout"
import { ctaBaseClass } from "../../Helpers/formStyles"
import { useSectionTone } from "../../Helpers/useSectionTone"
import MobileMenu from "./MobileMenu"
import MenuIcon from "./MenuIcon"
import NotificationBell from "../Alerts/NotificationBell/NotificationBell"

const SCROLL_THRESHOLD = 24

const PROBE_Y = 32

const authedLinks = [{ to: "/wallet", label: "Wallet" }]

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const tone = useSectionTone(PROBE_Y)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD)

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const isLight = tone === "light"

  const shellClass =
    !isScrolled && !menuOpen
      ? "border-transparent bg-transparent"
      : isLight
        ? "border-onyx-canvas/10 bg-cream-canvas/85 backdrop-blur-md"
        : "border-mist-border/10 bg-onyx-canvas/85 backdrop-blur-md"

  const wordmarkClass = isLight ? "text-onyx-canvas" : "text-ivory-text"
  const mutedClass = isLight ? "text-ink-muted" : "text-ash-text"
  const strongClass = isLight ? "text-onyx-canvas" : "text-ivory-text"

  const navLinkClass = (path: string) =>
    `text-label font-normal underline-offset-[6px] transition-colors duration-300 ${
      location.pathname.startsWith(path)
        ? `${strongClass} underline`
        : `${mutedClass} hover:underline`
    }`

  const ctaToneClass = isLight
    ? "bg-onyx-canvas text-ivory-text hover:bg-footer-navy"
    : "bg-ivory-text text-onyx-canvas hover:bg-pure-white"

  const sheetRowClass = `flex items-center justify-between rounded-card px-4 py-3.5 text-body-lg font-normal transition-colors duration-200 ${
    isLight
      ? "text-onyx-canvas hover:bg-onyx-canvas/6"
      : "text-ivory-text hover:bg-mist-border/8"
  }`

  // These point at sections of the home page. They go through the router
  // rather than a plain <a href="/#...">: from any other route that would be
  // a document navigation, reloading the whole app just to reach an anchor.
  const sectionLinks = [
    { to: "/#how-it-works", label: "How it works" },
    { to: "/#help", label: "Help Center" },
  ]

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b font-sans transition-colors duration-300 ${shellClass}`}
    >
      <div className={contentClass}>
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex shrink-0 items-center gap-3">
              <img
                src={logo}
                alt=""
                aria-hidden="true"
                className="h-7 object-contain"
              />
              <span
                className={`select-none text-body-lg font-bold uppercase tracking-wordmark transition-colors duration-300 ${wordmarkClass}`}
              >
                DOL<span className="text-cobalt">-</span>FIN
              </span>
            </Link>

            <div className="hidden items-center gap-7 md:flex">
              {sectionLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-label font-normal underline-offset-[6px] transition-colors duration-300 hover:underline ${mutedClass}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/search" className={navLinkClass("/search")}>
                Search
              </Link>
              {user &&
                authedLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={navLinkClass(link.to)}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                <NotificationBell isLight={isLight} />
                <div
                  className={`hidden items-baseline gap-2 rounded-pill px-3 py-2 transition-colors duration-300 sm:flex ${
                    isLight ? "bg-onyx-canvas/8" : "bg-mist-border/10"
                  }`}
                >
                  <span
                    className={`text-caption font-normal uppercase tracking-label-sm transition-colors duration-300 ${mutedClass}`}
                  >
                    {user.userName}
                  </span>
                  <span
                    className={`font-mono text-caption font-normal transition-colors duration-300 ${strongClass}`}
                  >
                    ${user.walletBalance?.toFixed(2) ?? "0.00"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className={`hidden cursor-pointer text-label font-normal underline-offset-[6px] transition-colors duration-300 hover:underline md:inline ${mutedClass}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hidden text-label font-normal underline-offset-[6px] transition-colors duration-300 hover:underline sm:inline ${mutedClass}`}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className={`cursor-pointer px-5 py-2 text-center text-body sm:px-6 ${ctaBaseClass} ${ctaToneClass}`}
                >
                  Create account
                </Link>
              </>
            )}

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={`-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-card transition-colors duration-200 md:hidden ${
                isLight
                  ? "text-onyx-canvas hover:bg-onyx-canvas/8"
                  : "text-ivory-text hover:bg-mist-border/10"
              }`}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        id={menuId}
        open={menuOpen}
        onClose={closeMenu}
        isLight={isLight}
        triggerRef={triggerRef}
      >
        {sectionLinks.map((link) => (
          <Link key={link.to} to={link.to} onClick={closeMenu} className={sheetRowClass}>
            {link.label}
          </Link>
        ))}
        <Link to="/search" onClick={closeMenu} className={sheetRowClass}>
          Search
        </Link>
        {user &&
          authedLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={closeMenu} className={sheetRowClass}>
              {link.label}
            </Link>
          ))}

        <span
          aria-hidden="true"
          className={`my-3 h-px w-full ${
            isLight ? "bg-onyx-canvas/10" : "bg-mist-border/10"
          }`}
        />

        {user ? (
          <>
            <div
              className={`flex items-baseline justify-between px-4 py-2 ${mutedClass}`}
            >
              <span className="text-caption font-normal uppercase tracking-label-sm">
                {user.userName}
              </span>
              <span className={`font-mono text-body ${strongClass}`}>
                ${user.walletBalance?.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                closeMenu()
                logout()
              }}
              className={`cursor-pointer text-left ${sheetRowClass}`}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" onClick={closeMenu} className={sheetRowClass}>
            Log in
          </Link>
        )}
      </MobileMenu>
    </nav>
  )
}

export default Navbar
