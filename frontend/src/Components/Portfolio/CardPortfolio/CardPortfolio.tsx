import { motion } from "framer-motion"
import DeletePortfolio from "../DeletePortfolio/DeletePortfolio"
import { Link } from "react-router-dom"
import type { PortfolioGet } from "../../../Models/Portfolio"
import type { SyntheticEvent } from "react"
import { companyLogos } from "../../../Components/Table/TestData"
import GlassLogo from "../../Dashboard/GlassLogo"
import { reveal } from "../../../Helpers/motion"
import { useLanguage } from "../../../i18n/useLanguage"

interface Props {
  portfolioValue: PortfolioGet
  onPortfolioDelete: (e: SyntheticEvent) => void
  totalPortfolioInvested: number
}

const CardPortfolio = ({
  portfolioValue,
  onPortfolioDelete,
  totalPortfolioInvested,
}: Props) => {
  const { t } = useLanguage()
  const symbolUpper = portfolioValue.symbol.toUpperCase()

  const currentPrice = portfolioValue.purchase || 0
  const quantity = portfolioValue.quantity || 0
  const avgCost = portfolioValue.averagePrice || 0

  const totalCost = quantity * avgCost
  const currentTotalValue = quantity * currentPrice
  const pnlAmount = currentTotalValue - totalCost
  const pnlPercentage = totalCost > 0 ? (pnlAmount / totalCost) * 100 : 0
  const isProfit = pnlAmount >= 0

  const currentWeightPercent =
    totalPortfolioInvested > 0 ? (totalCost / totalPortfolioInvested) * 100 : 0
  const weightString = `${currentWeightPercent.toFixed(0)}%`

  const figures = [
    {
      label: t("portfolio.card.invested"),
      value: `$${totalCost.toFixed(2)}`,
      tone: "text-band-ink",
    },
    {
      label: t("portfolio.card.currentValue"),
      value: `$${currentTotalValue.toFixed(2)}`,
      tone: "text-band-ink",
      align: "text-right",
    },
    {
      label: t("portfolio.card.avgLive"),
      value: `$${avgCost.toFixed(2)} / $${currentPrice.toFixed(2)}`,
      tone: "text-band-muted",
    },
  ]

  return (
    <motion.div
      variants={reveal}
      className="group relative flex flex-col rounded-card bg-band-surface p-5 ring-1 ring-inset ring-band-line/6 transition-shadow duration-200 hover:ring-band-line/16"
    >
      <div className="absolute right-3 top-3 z-10 cursor-pointer opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
        <DeletePortfolio
          portfolioValue={portfolioValue.symbol}
          onPortfolioDelete={onPortfolioDelete}
        />
      </div>

      <div className="flex items-center gap-3">
        <GlassLogo className="h-11 w-11" padding="p-2.5">
          {companyLogos[symbolUpper] ? (
            companyLogos[symbolUpper]()
          ) : (
            <span className="font-mono text-caption font-bold text-band-ink">
              {symbolUpper.substring(0, 2)}
            </span>
          )}
        </GlassLogo>
        <div className="flex flex-col text-left">
          <Link
            to={`/company/${portfolioValue.symbol}/company-profile`}
            className="text-subheading font-medium uppercase text-band-ink underline-offset-4 hover:underline"
          >
            {portfolioValue.symbol}
          </Link>
          <span className="font-mono text-caption font-normal text-band-muted">
            {t("portfolio.card.shares", { count: quantity })}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-left">
        {figures.map((f) => (
          <div key={f.label} className={`flex flex-col ${f.align ?? ""}`}>
            <dt className="font-mono text-caption font-normal uppercase tracking-label-sm text-band-subtle">
              {f.label}
            </dt>
            <dd className={`mt-1 font-mono text-body font-normal ${f.tone}`}>
              {f.value}
            </dd>
          </div>
        ))}

        <div className="flex flex-col text-right">
          <dt className="font-mono text-caption font-normal uppercase tracking-label-sm text-band-subtle">
            {t("portfolio.card.pnl")}
          </dt>
          <dd
            className={`mt-1 font-mono text-body font-bold ${
              isProfit ? "text-band-gain" : "text-band-loss"
            }`}
          >
            {isProfit ? "▲ +" : "▼ "}
            {pnlAmount.toFixed(2)} ({isProfit ? "+" : ""}
            {pnlPercentage.toFixed(2)}%)
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex w-full flex-col gap-2">
        <div className="flex items-center justify-between font-mono text-caption font-normal uppercase tracking-label-sm text-band-subtle">
          <span>{t("portfolio.card.weight")}</span>
          <span className="text-band-ink">{weightString}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-pill bg-onyx-canvas">
          <div
            className="h-full rounded-pill bg-cobalt"
            style={{ width: weightString }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default CardPortfolio
