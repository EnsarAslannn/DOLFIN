import { Link, useLocation } from "react-router-dom"
import {
  FaBuilding,
  FaTable,
  FaBalanceScale,
  FaMoneyBillWave,
} from "react-icons/fa"
import { useLanguage } from "../../i18n/useLanguage"

const links = [
  { to: "company-profile", labelKey: "company.sidebar.profile", Icon: FaBuilding },
  { to: "income-statement", labelKey: "company.sidebar.income", Icon: FaTable },
  { to: "balance-sheet", labelKey: "company.sidebar.balance", Icon: FaBalanceScale },
  {
    to: "cashflow-statement",
    labelKey: "company.sidebar.cashflow",
    Icon: FaMoneyBillWave,
  },
] as const

const Sidebar = () => {
  const location = useLocation()
  const { t } = useLanguage()

  const isActive = (path: string) => {
    return location.pathname.includes(path)
  }

  return (
    <nav className="absolute bottom-0 left-0 top-0 z-[9999] block w-64 -translate-x-full flex-row flex-nowrap border-r border-mist-border/8 bg-graphite-card px-4 pb-8 pt-28 text-left transition-all duration-300 ease-in-out md:z-10 md:translate-x-0">
      <div className="mx-auto flex w-full min-h-full flex-col flex-nowrap items-center justify-start overflow-y-auto overflow-x-hidden px-0">
        <div className="relative z-40 mt-4 flex h-auto w-full flex-1 flex-col items-stretch">
          <span className="mb-2 border-b border-mist-border/8 px-4 pb-3 font-mono text-caption font-normal uppercase tracking-label-lg text-ash-text">
            {t("company.sidebar.heading")}
          </span>
          <div className="flex list-none flex-col space-y-1 md:min-w-full md:flex-col">
            {links.map(({ to, labelKey, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`group relative flex items-center rounded-card py-3 text-body font-normal no-underline transition-colors duration-200 ${
                  isActive(to)
                    ? "border-l-[3px] border-cobalt bg-obsidian-button pl-[13px] pr-4 text-ivory-text"
                    : "px-4 text-ash-text hover:bg-obsidian-button hover:text-ivory-text"
                }`}
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${isActive(to) ? "text-cobalt" : "text-ash-text/70"}`}
                />
                <span className="ml-3 font-sans">{t(labelKey)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Sidebar
