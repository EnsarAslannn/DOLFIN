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
import { useLanguage } from "../../../i18n/useLanguage"
import type { Translate } from "../../../i18n/translate"
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
const conditionLabel = (t: Translate, condition: PriceAlertCondition) =>
  t(
    condition === "GreaterThanOrEqual"
      ? "alerts.condition.rises"
      : "alerts.condition.falls",
  )

const PriceAlerts = () => {
  const { t, language } = useLanguage()
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
      toast.warning(t("alerts.toast.pickCompany"))
      return
    }

    const price = parseFloat(targetPrice)
    if (Number.isNaN(price) || price <= 0) {
      toast.warning(t("alerts.toast.badPrice"))
      return
    }

    setSubmitting(true)
    try {
      const res = await alertCreateAPI(stock.id, price, condition)
      if (!res) return

      toast.success(
        // One sentence per direction: a shared fragment cannot sit in the same
        // slot in both languages without wrecking the word order in one.
        t(
          condition === "GreaterThanOrEqual"
            ? "alerts.toast.watching.rises"
            : "alerts.toast.watching.falls",
          { symbol: stock.symbol, price: `$${price.toFixed(2)}` },
        ),
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

    toast.success(t("alerts.toast.removed", { symbol: alert.symbol }))
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
          eyebrow={t("alerts.eyebrow")}
          title={t("alerts.title")}
          lead={t("alerts.lead")}
        />
      </Reveal>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
        <Reveal className="rounded-card bg-band-surface p-6 ring-1 ring-inset ring-band-line/6 lg:col-span-2">
          <h3 className="text-subheading font-medium text-band-ink">
            {t("alerts.form.title")}
          </h3>
          <p className="mt-2 text-body font-normal text-band-muted">
            {t("alerts.form.lead")}
          </p>

          <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-5">
            <div className="w-full text-left">
              <label htmlFor="alert-stock" className={labelClass}>
                {t("alerts.form.stock")}
              </label>
              <select
                id="alert-stock"
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="">{t("alerts.form.selectCompany")}</option>
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
                {t("alerts.form.condition")}
              </label>
              <select
                id="alert-condition"
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as PriceAlertCondition)
                }
                className={`${fieldClass} cursor-pointer`}
              >
                <option value="GreaterThanOrEqual">
                  {t("alerts.form.rises")}
                </option>
                <option value="LessThanOrEqual">
                  {t("alerts.form.falls")}
                </option>
              </select>
            </div>

            <div className="w-full text-left">
              <label htmlFor="alert-target" className={labelClass}>
                {t("alerts.form.target")}
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
              {submitting ? t("alerts.form.saving") : t("alerts.form.submit")}
            </button>
          </form>
        </Reveal>

        <div className="lg:col-span-3">
          {loading ? (
            <DataLoader label={t("alerts.loading")} />
          ) : alerts.length === 0 ? (
            <EmptyState
              variant="wallet"
              title={t("alerts.empty.title")}
              description={t("alerts.empty.description")}
            />
          ) : (
            <div className="overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6">
              <div className="overflow-x-auto">
                <table
                  aria-label={t("alerts.table.label")}
                  className="w-full border-collapse text-left font-sans"
                >
                  <thead>
                    <tr className="border-b border-band-line/8 font-mono text-caption font-bold uppercase tracking-label-lg text-band-muted">
                      <th className="px-6 py-4">{t("alerts.col.asset")}</th>
                      <th className="px-6 py-4">{t("alerts.col.trigger")}</th>
                      <th className="px-6 py-4">{t("alerts.col.status")}</th>
                      <th className="px-6 py-4 text-right">
                        {t("alerts.col.action")}
                      </th>
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
                            {t("alerts.row.trigger", {
                              condition: conditionLabel(t, alert.condition),
                            })}{" "}
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
                              {fired
                                ? t("alerts.status.triggered")
                                : t("alerts.status.watching")}
                            </span>
                            {fired && (
                              <span className="mt-1 block font-mono text-caption font-normal text-band-muted">
                                {formatTimestamp(alert.triggeredAt!, language)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(alert)}
                              aria-label={t("alerts.remove.aria", {
                                symbol: alert.symbol.toUpperCase(),
                              })}
                              className="cursor-pointer rounded-pill px-4 py-2 text-body font-normal text-band-muted ring-1 ring-inset ring-band-line/8 transition-colors hover:text-band-loss hover:ring-band-loss/50"
                            >
                              {t("alerts.remove")}
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
