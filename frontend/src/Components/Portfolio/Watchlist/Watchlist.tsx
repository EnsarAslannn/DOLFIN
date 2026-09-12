import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { watchlistGetAPI, watchlistRemoveAPI } from "../../../Services/WatchlistService"
import { PanelHeader } from "../../Dashboard/Panel"
import EmptyState from "../../Dashboard/EmptyState"
import Reveal from "../../Dashboard/Reveal"
import DataLoader from "../../Dashboard/DataLoader"
import { ctaBaseClass, ctaFillClass } from "../../../Helpers/formStyles"
import { subscribeToWatchlistChanges } from "../../../Helpers/watchlistEvents"
import { useLanguage } from "../../../i18n/useLanguage"
import type { WatchlistItem } from "../../../Models/Watchlist"

/**
 * The companies a user is following without owning.
 *
 * The only way to keep an eye on something used to be a price alert, which
 * makes you name a level and a direction before you have an opinion worth
 * naming one for.
 */
const Watchlist = () => {
  const { t } = useLanguage()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const res = await watchlistGetAPI()
    if (res?.data) setItems(res.data)
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const res = await watchlistGetAPI()
        if (active && res?.data) setItems(res.data)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  // Following happens on the search page, which cannot reach this component's
  // state -- the same reason the alerts list listens for its own changes.
  useEffect(() => subscribeToWatchlistChanges(refresh), [refresh])

  const handleRemove = async (item: WatchlistItem) => {
    // Dropped locally first so the row goes when it is clicked; a failed call
    // puts it back on the next refresh.
    setItems((previous) => previous.filter((entry) => entry.stockId !== item.stockId))

    await watchlistRemoveAPI(item.stockId)
    toast.success(t("watchlist.toast.removed", { symbol: item.symbol.toUpperCase() }))
    await refresh()
  }

  return (
    <section className="flex w-full flex-col gap-8">
      <Reveal>
        <PanelHeader
          eyebrow={t("watchlist.eyebrow")}
          title={t("watchlist.title")}
          lead={t("watchlist.lead")}
        />
      </Reveal>

      {loading ? (
        <DataLoader label={t("watchlist.loading")} />
      ) : items.length === 0 ? (
        <EmptyState
          variant="wallet"
          title={t("watchlist.empty.title")}
          description={t("watchlist.empty.description")}
        >
          <Link
            to="/search"
            className={`inline-flex items-center px-6 py-3 text-body ${ctaBaseClass} ${ctaFillClass}`}
          >
            {t("watchlist.empty.cta")}
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6">
          <div className="overflow-x-auto">
            <table
              aria-label={t("watchlist.table.label")}
              className="w-full border-collapse text-left font-sans"
            >
              <thead>
                <tr className="border-b border-band-line/8 font-mono text-caption font-bold uppercase tracking-label-lg text-band-muted">
                  <th className="px-6 py-4">{t("watchlist.col.company")}</th>
                  <th className="px-6 py-4">{t("watchlist.col.sector")}</th>
                  <th className="px-6 py-4 text-right">{t("watchlist.col.price")}</th>
                  <th className="px-6 py-4 text-right">
                    <span className="sr-only">{t("watchlist.remove")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-band-line/8 text-body font-normal">
                {items.map((item) => (
                  <tr
                    key={item.stockId}
                    className="transition-colors hover:bg-band-raised"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-body font-normal text-band-ink">
                          {item.companyName}
                        </span>
                        <span className="font-mono text-caption font-normal tracking-wide text-band-muted">
                          {item.symbol.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-band-muted">{item.industry}</td>
                    <td className="px-6 py-4 text-right font-mono text-band-ink">
                      ${item.purchase.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        aria-label={t("watchlist.remove.aria", {
                          symbol: item.symbol.toUpperCase(),
                        })}
                        className="cursor-pointer rounded-pill px-4 py-2 text-body font-normal text-band-muted ring-1 ring-inset ring-band-line/8 transition-colors hover:text-band-loss hover:ring-band-loss/50"
                      >
                        {t("watchlist.remove")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default Watchlist
