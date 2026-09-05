import React, { type SyntheticEvent } from "react"
import { motion } from "framer-motion"
import AddPortfolio from "../Portfolio/AddPortfolio/AddPortfolio"
import { Link } from "react-router-dom"
import { companyLogos } from "../../Components/Table/TestData"
import GlassLogo from "../Dashboard/GlassLogo"
import type { StockSearchResult } from "../../Models/StockSearchResult"
import { formatLargeMonetaryNumber } from "../../Helpers/NumberFormatting"
import { reveal } from "../../Helpers/motion"
import { useLanguage } from "../../i18n/useLanguage"

interface Props {
  id: string
  searchResult: StockSearchResult
  onPortfolioCreate: (e: SyntheticEvent) => void
}

export const resultGridClass =
  "grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] md:items-center"

const Card: React.FC<Props> = ({ id, searchResult, onPortfolioCreate }: Props) => {
  const { t } = useLanguage()
  const symbol = searchResult.symbol || searchResult.Symbol || ""
  const name =
    searchResult.companyName ||
    searchResult.CompanyName ||
    searchResult.name ||
    ""
  const price = searchResult.purchase || searchResult.Purchase || 0
  const industry =
    searchResult.industry ||
    searchResult.Industry ||
    t("search.industry.fallback")
  const marketCap = searchResult.marketCap || searchResult.MarketCap || 0

  const symbolUpper = symbol.toUpperCase()
  const isPositive = price > 150

  const statementLinks = [
    { to: "company-profile", label: t("search.link.profile") },
    { to: "income-statement", label: t("search.link.income") },
    { to: "balance-sheet", label: t("search.link.balance") },
    { to: "cashflow-statement", label: t("search.link.cashflow") },
  ]

  return (
    <motion.div
      variants={reveal}
      className={`group border-b border-band-line/8 px-4 py-5 transition-colors duration-200 last:border-b-0 hover:bg-band-surface/60 md:px-6 ${resultGridClass}`}
      key={id}
      id={id}
    >
      <div className="flex min-w-0 items-start gap-4">
        <GlassLogo className="h-11 w-11" padding="p-2.5">
          {companyLogos[symbolUpper] ? (
            companyLogos[symbolUpper]()
          ) : (
            <span className="font-mono text-caption font-bold text-band-ink">
              {symbolUpper.slice(0, 4)}
            </span>
          )}
        </GlassLogo>

        <div className="flex min-w-0 flex-col gap-1.5 text-left">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <Link
              to={`/company/${symbolUpper}/company-profile`}
              className="text-body-lg font-medium text-band-ink underline-offset-4 hover:underline"
            >
              {name}
            </Link>
            <span className="font-mono text-caption font-normal uppercase tracking-label-sm text-band-subtle">
              {symbolUpper}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:opacity-70 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
            {statementLinks.map((link) => (
              <Link
                key={link.to}
                to={`/company/${symbolUpper}/${link.to}`}
                className="text-caption font-normal text-band-muted underline-offset-4 transition-colors duration-150 hover:text-band-ink hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="truncate text-left text-body font-normal text-band-muted">
        {industry}
      </div>

      <div className="text-left font-mono text-body font-normal text-band-muted md:text-right">
        {formatLargeMonetaryNumber(marketCap) ?? "—"}
      </div>

      <div className="flex flex-col items-start md:items-end">
        <span className="font-mono text-body-lg font-normal text-band-ink">
          ${price.toFixed(2)}
        </span>
        <span
          className={`mt-1 font-mono text-caption font-bold ${
            isPositive ? "text-band-gain" : "text-band-loss"
          }`}
        >
          {isPositive ? "▲ +1.45%" : "▼ −0.85%"}
        </span>
      </div>

      <AddPortfolio onPortfolioCreate={onPortfolioCreate} symbol={symbolUpper} />
    </motion.div>
  )
}

export default Card
