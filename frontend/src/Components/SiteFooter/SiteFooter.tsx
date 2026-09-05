import { Link } from "react-router-dom"
import logo from "../../assets/dolphin.png"
import { bandClass, contentClass } from "../../Helpers/layout"
import { TONE_ATTR } from "../../Helpers/useSectionTone"
import { useLanguage } from "../../i18n/useLanguage"

const SiteFooter = () => {
  const { t } = useLanguage()

  const columns = [
    {
      heading: t("footer.col.platform"),
      links: [
        { to: "/search", label: t("nav.search") },
        { to: "/wallet", label: t("nav.wallet") },
      ],
    },
    {
      heading: t("footer.col.account"),
      links: [
        { to: "/login", label: t("nav.login") },
        { to: "/register", label: t("nav.createAccount") },
      ],
    },
    {
      heading: t("footer.col.company"),
      links: [
        { to: "/#how-it-works", label: t("nav.howItWorks") },
        { to: "/#help", label: t("nav.helpCenter") },
      ],
    },
  ]

  return (
  <footer
    {...{ [TONE_ATTR]: "dark" }}
    className={`bg-footer-navy font-sans ${bandClass}`}
  >
    <div className={`py-section ${contentClass}`}>
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-x-16">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="h-7 object-contain"
            />
            <span className="select-none text-body-lg font-bold uppercase tracking-wordmark text-ivory-text">
              DOL<span className="text-cobalt">-</span>FIN
            </span>
          </Link>
          <p className="mt-6 max-w-[300px] text-body font-normal text-ash-text">
            {t("footer.tagline")}
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="font-mono text-caption font-normal uppercase tracking-label-lg text-ash-text/70">
              {col.heading}
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-body font-normal text-ash-text underline-offset-4 transition-colors duration-200 hover:text-ivory-text hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-20 flex flex-col gap-3 border-t border-slate-border/30 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-caption font-normal uppercase tracking-label text-ash-text/70">
          {t("footer.copyright")}
        </span>
        <span className="font-mono text-caption font-normal uppercase tracking-label text-ash-text/70">
          {t("footer.disclaimer")}
        </span>
      </div>
    </div>
  </footer>
  )
}

export default SiteFooter
