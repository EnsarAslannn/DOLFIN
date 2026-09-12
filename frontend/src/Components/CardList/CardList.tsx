import React, { type SyntheticEvent } from "react"
import { motion } from "framer-motion"
import Card, { resultGridClass } from "../Card/Card"
import SearchEmptyState from "../Dashboard/SearchEmptyState"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import { revealGroup } from "../../Helpers/motion"
import { useLanguage } from "../../i18n/useLanguage"
import type { StockSearchResult } from "../../Models/StockSearchResult"

interface Props {
  searchResults: StockSearchResult[]
  onPortfolioCreate: (e: SyntheticEvent) => void
  hasSearched?: boolean
  watchedStockIds?: Set<number>
  onWatchToggle?: (stockId: number, symbol: string) => void
}

const CardList: React.FC<Props> = ({
  searchResults,
  onPortfolioCreate,
  hasSearched = false,
  watchedStockIds,
  onWatchToggle,
}: Props) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()

  if (searchResults.length === 0) {
    return hasSearched ? (
      <SearchEmptyState
        title={t("search.noMatch.title")}
        description={t("search.noMatch.description")}
      />
    ) : (
      <SearchEmptyState />
    )
  }

  return (
    <div className="w-full">
      <div
        aria-hidden="true"
        className={`hidden border-b border-band-line/10 px-4 pb-3 font-mono text-caption font-normal uppercase tracking-label text-band-subtle md:grid md:px-6 ${resultGridClass}`}
      >
        <span>{t("search.col.company")}</span>
        <span>{t("search.col.industry")}</span>
        <span className="md:text-right">{t("search.col.marketCap")}</span>
        <span className="md:text-right">{t("search.col.price")}</span>
        <span className="w-[72px]" />
      </div>

    <motion.div
      key={searchResults.length}
      variants={revealGroup}
      {...(prefersReducedMotion
        ? {}
        : { initial: "hidden" as const, animate: "visible" as const })}
      className="flex flex-col"
    >
      {searchResults.map((result, index) => {
        const currentSymbol = result.symbol || result.Symbol || `stock-${index}`

        const stockId = result.id ?? result.Id

        return (
          <Card
            id={currentSymbol}
            key={currentSymbol}
            searchResult={result}
            onPortfolioCreate={onPortfolioCreate}
            isWatched={stockId !== undefined && (watchedStockIds?.has(stockId) ?? false)}
            onWatchToggle={onWatchToggle}
          />
        )
      })}
    </motion.div>
    </div>
  )
}

export default CardList
