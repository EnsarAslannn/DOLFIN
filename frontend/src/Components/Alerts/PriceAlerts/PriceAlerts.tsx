import { useCallback, useEffect, useState, type SyntheticEvent } from "react"
import { toast } from "react-toastify"
import {
  alertCreateAPI,
  alertDeleteAPI,
  alertsGetAPI,
} from "../../../Services/AlertService"
import { getAllStocksAPI } from "../../../Services/StockService"
import { toStockOption, type StockOption } from "../../StockComment/stockOptions"
import { PanelHeader } from "../../Dashboard/Panel"
import EmptyState from "../../Dashboard/EmptyState"
import Reveal from "../../Dashboard/Reveal"
import DataLoader from "../../Dashboard/DataLoader"
import { formatTimestamp } from "../../../Helpers/dateTime"
import { notifyAlertsChanged } from "../../../Helpers/alertEvents"
import {
  fieldClass,
  labelClass,
  ctaBaseClass,
  ctaFillClass,
  ctaDisabledClass,
} from "../../../Helpers/formStyles"
import type { PriceAlert, PriceAlertCondition } from "../../../Models/Alert"
import type { StockSearchResult } from "../../../Models/StockSearchResult"

// The API stores the trigger as a .NET enum name; these are the only two it
// accepts, so the select is built from them rather than from free text.
const conditionLabel = (condition: PriceAlertCondition) =>
  condition === "GreaterThanOrEqual" ? "rises to" : "falls to"

const PriceAlerts = () => {
  const [stocks, setStocks] = useState<StockOption[]>([])
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stockId, setStockId] = useState("")
  const [condition, setCondition] = useState<PriceAlertCondition>("GreaterThanOrEqual")
  const [targetPrice, setTargetPrice] = useState("")

  const refreshAlerts = useCallback(async () => {
    const res = await alertsGetAPI()
    if (res?.data) setAlerts(res.data)
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const [stockRes, alertRes] = await Promise.all([
          getAllStocksAPI(),
          alertsGetAPI(),
        ])
        if (!active) return

        const options = Array.isArray(stockRes?.data)
          ? (stockRes.data as StockSearchResult[])
              .map(toStockOption)
              .filter((s): s is StockOption => s !== null)
          : []

        setStocks(options)
        setAlerts(alertRes?.data ?? [])
      } catch (e) {
        console.error("Price alerts load failed:", e)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const handleCreate = async (e: SyntheticEvent) => {
    e.preventDefault()

    const stock = stocks.find((s) => s.id === Number(stockId))
    if (!stock) {
      toast.warning("Pick the company you want to watch.")
      return
    }

    const price = parseFloat(targetPrice)
    if (Number.isNaN(price) || price <= 0) {
      toast.warning("Enter a target price greater than 0.")
      return
    }

    setSubmitting(true)
    try {
      const res = await alertCreateAPI(stock.id, price, condition)
      if (!res) return

      toast.success(
        `Watching ${stock.symbol} for $${price.toFixed(2)} ${conditionLabel(condition)}.`,
      )
      setTargetPrice("")
      await refreshAlerts()
      notifyAlertsChanged()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (alert: PriceAlert) => {
    const res = await alertDeleteAPI(alert.id)
    if (!res) return

    toast.success(`Alert on ${alert.symbol} removed.`)
    await refreshAlerts()
    // Removing an alert takes any notification it raised with it, so the bell
    // has to be told rather than left to catch up on its next poll.
    notifyAlertsChanged()
  }

  const canSubmit = Boolean(stockId) && Boolean(targetPrice) && !submitting

  return (
    <section className="flex w-full flex-col gap-8">
      <Reveal>
        <PanelHeader
          eyebrow="Alerts"
          title="Price alerts"
          lead="Name a price and we watch it for you. Prices move on a one-minute cadence, and a triggered alert shows up under the bell in the header."
        />
      </Reveal>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
        <Reveal className="rounded-card bg-band-surface p-6 ring-1 ring-inset ring-band-line/6 lg:col-span-2">
          <h3 className="text-subheading font-medium text-band-ink">
            Watch a price
          </h3>
          <p className="mt-2 text-body font-normal text-band-muted">
            Pick a company, choose a direction and set the level to be told about.
          </p>

          <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-5">
            <div className="w-full text-left">
              <label htmlFor="alert-stock" className={labelClass}>
                Stock / ticker
              </label>
              <select
                id="alert-stock"
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="">Select a company…</option>
                {stocks.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.symbol}
                    {stock.companyName ? ` — ${stock.companyName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full text-left">
              <label htmlFor="alert-condition" className={labelClass}>
                Tell me when the price
              </label>
              <select
                id="alert-condition"
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as PriceAlertCondition)
                }
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="GreaterThanOrEqual">Rises to or above</option>
                <option value="LessThanOrEqual">Falls to or below</option>
              </select>
            </div>

            <div className="w-full text-left">
              <label htmlFor="alert-target" className={labelClass}>
                Target price
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono text-body font-normal text-band-muted">
                  $
                </span>
                <input
                  id="alert-target"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className={`${fieldClass} pl-8 font-mono`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`self-start px-6 py-3 text-body ${ctaBaseClass} ${
                canSubmit ? ctaFillClass : ctaDisabledClass
              }`}
            >
              {submitting ? "Saving…" : "Create alert"}
            </button>
          </form>
        </Reveal>

        <div className="lg:col-span-3">
          {loading ? (
            <DataLoader label="Loading alerts" />
          ) : alerts.length === 0 ? (
            <EmptyState
              variant="wallet"
              title="Nothing on watch"
              description="Set an alert and it will sit here until the market reaches your level."
            />
          ) : (
            <div className="overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6">
              <div className="overflow-x-auto">
                <table
                  aria-label="Price alerts"
                  className="w-full border-collapse text-left font-sans"
                >
                  <thead>
                    <tr className="border-b border-band-line/8 font-mono text-caption font-bold uppercase tracking-label-lg text-band-muted">
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4">Trigger</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-band-line/8 text-body font-normal">
                    {alerts.map((alert) => {
                      const fired = Boolean(alert.triggeredAt)

                      return (
                        <tr
                          key={alert.id}
                          className="transition-colors hover:bg-band-raised"
                        >
                          <td className="px-6 py-4 font-mono text-body font-normal text-band-ink">
                            {alert.symbol.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 font-normal text-band-muted">
                            Price {conditionLabel(alert.condition)}{" "}
                            <span className="font-mono text-band-ink">
                              ${alert.targetPrice.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-pill px-3 py-1 font-mono text-caption font-bold uppercase tracking-label ring-1 ring-inset ${
                                fired
                                  ? "text-band-gain ring-band-gain/30"
                                  : "text-band-muted ring-band-line/20"
                              }`}
                            >
                              {fired ? "Triggered" : "Watching"}
                            </span>
                            {fired && (
                              <span className="mt-1 block font-mono text-caption font-normal text-band-muted">
                                {formatTimestamp(alert.triggeredAt!)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(alert)}
                              aria-label={`Remove alert on ${alert.symbol.toUpperCase()}`}
                              className="cursor-pointer rounded-pill px-4 py-2 text-body font-normal text-band-muted ring-1 ring-inset ring-band-line/8 transition-colors hover:text-band-loss hover:ring-band-loss/50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default PriceAlerts
