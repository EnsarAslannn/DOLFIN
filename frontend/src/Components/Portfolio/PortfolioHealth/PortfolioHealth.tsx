import { useCallback, useEffect, useState } from "react"
import {
  portfolioRebalanceAPI,
  portfolioWarningsAPI,
} from "../../../Services/PortfolioService"
import { PanelHeader } from "../../Dashboard/Panel"
import EmptyState from "../../Dashboard/EmptyState"
import Reveal from "../../Dashboard/Reveal"
import DataLoader from "../../Dashboard/DataLoader"
import { useLanguage } from "../../../i18n/useLanguage"
import type { Translate, TranslationKey } from "../../../i18n"
import type {
  AllocationWarning,
  RebalancingRecommendation,
  StockAdjustment,
} from "../../../Models/Portfolio"

/**
 * The two reads the API has always computed and nothing ever showed.
 *
 * PortfolioAnalyticsService produced concentration warnings and
 * RebalancingService produced an equal-weight target, both covered by tests,
 * both reachable over HTTP, and neither had so much as a service function on
 * this side -- they ran for an audience of their own test suite.
 */

// The API sends the code and the figure; the sentence is written here so it
// can be written in whichever language the page is showing.
const warningText = (warning: AllocationWarning, t: Translate): string => {
  const percent = warning.percent.toFixed(1)

  if (warning.code === "portfolio.warning.concentration" && warning.symbol) {
    return t("portfolio.warning.concentration", {
      symbol: warning.symbol.toUpperCase(),
      percent,
    })
  }

  if (warning.code === "portfolio.warning.sector" && warning.industry) {
    return t("portfolio.warning.sector", { industry: warning.industry, percent })
  }

  // A warning the client has not learned yet still reads as a sentence.
  return warning.message
}

// "Buy" / "Sell" / "Hold" arrive as the API's own words, which is what makes
// them translatable here rather than something to print raw.
const actionText = (adjustment: StockAdjustment, t: Translate): string => {
  const key = `health.action.${adjustment.action}` as TranslationKey
  const label = t(key, { quantity: String(adjustment.suggestedQuantity) })

  return label === key ? adjustment.action : label
}

const PortfolioHealth = () => {
  const { t } = useLanguage()
  const [warnings, setWarnings] = useState<AllocationWarning[]>([])
  const [rebalance, setRebalance] = useState<RebalancingRecommendation | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [warningRes, rebalanceRes] = await Promise.all([
      portfolioWarningsAPI(),
      portfolioRebalanceAPI(),
    ])

    if (warningRes?.data) setWarnings(warningRes.data)
    if (rebalanceRes?.data) setRebalance(rebalanceRes.data)
  }, [])

  useEffect(() => {
    let active = true

    const run = async () => {
      setLoading(true)
      try {
        await load()
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [load])

  const adjustments = rebalance?.adjustments ?? []
  const hasPositions = adjustments.length > 0

  return (
    <section className="flex w-full flex-col gap-8">
      <Reveal>
        <PanelHeader
          eyebrow={t("health.eyebrow")}
          title={t("health.title")}
          lead={t("health.lead")}
        />
      </Reveal>

      {loading ? (
        <DataLoader label={t("health.loading")} />
      ) : !hasPositions ? (
        <EmptyState
          variant="wallet"
          title={t("health.empty.title")}
          description={t("health.empty.description")}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
          <Reveal className="lg:col-span-2">
            <h3 className="text-heading-sm font-medium text-band-ink">
              {t("health.warnings.title")}
            </h3>

            {warnings.length === 0 ? (
              <p className="mt-4 text-body font-normal text-band-muted">
                {t("health.warnings.clear")}
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {warnings.map((warning) => (
                  <li
                    key={`${warning.code}:${warning.symbol ?? warning.industry}`}
                    className="rounded-card bg-band-surface px-5 py-4 text-body font-normal text-band-ink ring-1 ring-inset ring-band-loss/25"
                  >
                    {warningText(warning, t)}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <div className="lg:col-span-3">
            <h3 className="text-heading-sm font-medium text-band-ink">
              {t("health.rebalance.title")}
            </h3>
            <p className="mt-2 text-body font-normal text-band-muted">
              {rebalance && rebalance.holdingCount > 0
                ? t("health.rebalance.summary", {
                    count: String(rebalance.holdingCount),
                    target: rebalance.targetAllocationPercent.toFixed(1),
                  })
                : t("health.rebalance.none")}
            </p>

            <div className="mt-5 overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6">
              <div className="overflow-x-auto">
                <table
                  aria-label={t("health.table.label")}
                  className="w-full border-collapse text-left font-sans"
                >
                  <thead>
                    <tr className="border-b border-band-line/8 font-mono text-caption font-bold uppercase tracking-label-lg text-band-muted">
                      <th className="px-6 py-4">{t("health.col.asset")}</th>
                      <th className="px-6 py-4 text-right">
                        {t("health.col.current")}
                      </th>
                      <th className="px-6 py-4 text-right">
                        {t("health.col.target")}
                      </th>
                      <th className="px-6 py-4 text-right">
                        {t("health.col.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-band-line/8 text-body font-normal">
                    {adjustments.map((adjustment) => (
                      <tr
                        key={adjustment.stockId}
                        className="transition-colors hover:bg-band-raised"
                      >
                        <td className="px-6 py-4 font-mono text-body font-normal text-band-ink">
                          {adjustment.symbol.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-band-ink">
                          {adjustment.currentAllocationPercent.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-band-muted">
                          {adjustment.targetAllocationPercent.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`rounded-pill px-3 py-1 font-mono text-caption font-bold uppercase tracking-label ring-1 ring-inset ${
                              adjustment.action === "Buy"
                                ? "text-band-gain ring-band-gain/30"
                                : adjustment.action === "Sell"
                                  ? "text-band-loss ring-band-loss/30"
                                  : "text-band-muted ring-band-line/20"
                            }`}
                          >
                            {actionText(adjustment, t)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-caption font-normal text-band-muted">
              {t("health.rebalance.hint")}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default PortfolioHealth
