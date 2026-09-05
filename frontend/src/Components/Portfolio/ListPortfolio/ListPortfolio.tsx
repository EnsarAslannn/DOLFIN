import type { SyntheticEvent } from "react"
import { motion } from "framer-motion"
import CardPortfolio from "../CardPortfolio/CardPortfolio"
import EmptyState from "../../Dashboard/EmptyState"
import { PanelHeader } from "../../Dashboard/Panel"
import Reveal from "../../Dashboard/Reveal"
import { usePrefersReducedMotion } from "../../../Helpers/usePrefersReducedMotion"
import { revealGroup, revealProps } from "../../../Helpers/motion"
import { useLanguage } from "../../../i18n/useLanguage"
import type { PortfolioGet } from "../../../Models/Portfolio"

type Props = {
  portfolioValues: PortfolioGet[]
  onPortfolioDelete: (e: SyntheticEvent) => void
}

const ListPortfolio = ({ portfolioValues, onPortfolioDelete }: Props) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()

  const holdings = portfolioValues ?? []
  const totalPortfolioInvested = holdings.reduce((sum, item) => {
    const qty = item.quantity || 0
    const avg = item.averagePrice || 0
    return sum + qty * avg
  }, 0)

  return (
    <div className="flex flex-col gap-8">
      <Reveal>
        <PanelHeader
          eyebrow={t("portfolio.eyebrow")}
          title={t("portfolio.title")}
          lead={
            holdings.length > 0
              ? t(
                  holdings.length === 1
                    ? "portfolio.lead.one"
                    : "portfolio.lead.other",
                  {
                    count: holdings.length,
                    invested: totalPortfolioInvested.toFixed(2),
                  },
                )
              : undefined
          }
        />
      </Reveal>

      {holdings.length > 0 ? (
        <motion.div
          variants={revealGroup}
          {...revealProps(prefersReducedMotion)}
          className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {holdings.map((portfolioValue, index) => (
            <CardPortfolio
              key={portfolioValue.symbol ?? index}
              portfolioValue={portfolioValue}
              onPortfolioDelete={onPortfolioDelete}
              totalPortfolioInvested={totalPortfolioInvested}
            />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          variant="wallet"
          title={t("portfolio.empty.title")}
          description={t("portfolio.empty.description")}
        />
      )}
    </div>
  )
}

export default ListPortfolio
