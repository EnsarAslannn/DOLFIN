import Reveal from "../Dashboard/Reveal"
import Band from "../Dashboard/Band"
import { isDemoTicker } from "../../Helpers/demoStocks"
import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import type { CompanyBalanceSheet } from "../../company"
import { getBalanceSheet } from "../../api"
import Table from "../Table/Table"
import Spinners from "../Spinners/Spinners"
import { formatLargeMonetaryNumber } from "../../Helpers/NumberFormatting"
import { testIncomeStatementData } from "../../Components/Table/TestData"
import { useLanguage } from "../../i18n/useLanguage"
import type { TranslationKey } from "../../i18n/translations"

const config = [
  {
    labelKey: "balance.col.year",
    render: (company: CompanyBalanceSheet) => company.calendarYear,
  },
  {
    labelKey: "balance.col.totalAssets",
    bold: true,
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.totalAssets),
  },
  {
    labelKey: "balance.col.currentAssets",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.totalCurrentAssets),
  },
  {
    labelKey: "balance.col.totalCash",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.cashAndCashEquivalents),
  },
  {
    labelKey: "balance.col.property",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.propertyPlantEquipmentNet),
  },
  {
    labelKey: "balance.col.intangible",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.intangibleAssets),
  },
  {
    labelKey: "balance.col.longTermDebt",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.longTermDebt),
  },
  {
    labelKey: "balance.col.totalDebt",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.totalDebt),
  },
  {
    labelKey: "balance.col.totalLiabilities",
    bold: true,
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.totalLiabilities),
  },
  {
    labelKey: "balance.col.currentLiabilities",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.totalCurrentLiabilities),
  },
  {
    labelKey: "balance.col.longTermTaxes",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.otherLiabilities),
  },
  {
    labelKey: "balance.col.equity",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.totalStockholdersEquity),
  },
  {
    labelKey: "balance.col.retainedEarnings",
    render: (company: CompanyBalanceSheet) =>
      formatLargeMonetaryNumber(company.retainedEarnings),
  },
]

const BalanceSheet = () => {
  const ticker = useOutletContext<string>()
  const { t } = useLanguage()

  // A couple of rows are subtotals and render bold; the flag survives the
  // label becoming a lookup.
  const tableConfig = config.map(({ labelKey, bold, render }) => ({
    label: bold ? (
      <div className="font-bold">{t(labelKey as TranslationKey)}</div>
    ) : (
      t(labelKey as TranslationKey)
    ),
    render,
  }))
  const [balanceSheet, setBalanceSheet] = useState<CompanyBalanceSheet[]>()

  useEffect(() => {
    const getData = async () => {
      const value = await getBalanceSheet(ticker!)
      const sortedData = [...value.data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )
      setBalanceSheet(sortedData)
    }
    getData()
  }, [ticker])


  if (!isDemoTicker(ticker)) {
    return (
      <div className="rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 w-full rounded-card p-8 flex flex-col items-center justify-center text-center min-h-[350px] space-y-4 my-4 animate-fadeIn">
        <div className="flex h-16 w-16 items-center justify-center rounded-icon bg-band-raised">
          <svg
                className="h-6 w-6 text-band-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15l3.5-4 3 2.5L20 7" />
              </svg>
        </div>
        <div className="flex flex-col space-y-1">
          <h3 className="text-subheading font-normal text-band-ink tracking-tight">
            {t("company.unavailable.title")}
          </h3>
          <p className="text-body text-band-muted font-mono">
            {t("company.unavailable.code")}
          </p>
        </div>
        <p className="text-body text-band-muted max-w-md leading-relaxed">
          {t("company.unavailable.body", {
            ticker: ticker?.toUpperCase() ?? "",
          })}
        </p>
        <div className="pt-2">
          <p className="text-caption text-band-muted font-normal bg-band-raised px-3 py-2 rounded-card font-mono">
            {t("company.unavailable.tiers")}
          </p>
        </div>
      </div>
    )
  }

  const calculateMetrics = (data: CompanyBalanceSheet[]) => {
    if (data.length === 0)
      return {
        dte: 0,
        turnover: 0,
        dteFormatted: "0.00",
        turnoverFormatted: "0.00",
        summaryText: "",
        status: "NEUTRAL",
      }

    const latest = data[data.length - 1]
    const dte =
      latest.totalStockholdersEquity > 0
        ? latest.totalLiabilities / latest.totalStockholdersEquity
        : 0

    const companyInc = testIncomeStatementData.find(
      (c) =>
        c.symbol.toUpperCase() === ticker.toUpperCase() &&
        c.calendarYear === latest.calendarYear,
    )
    const revenue = companyInc ? companyInc.revenue : latest.totalAssets * 0.8
    const turnover = revenue / latest.totalAssets

    const vars = { dte: dte.toFixed(2), turnover: turnover.toFixed(2) }

    let status = "STABLE"
    let summaryText = t("balance.summary.stable", vars)

    if (dte > 2.0) {
      status = "LEVERAGED"
      summaryText = t("balance.summary.leveraged", vars)
    } else if (turnover < 0.3) {
      status = "CAUTIOUS"
      summaryText = t("balance.summary.cautious", vars)
    }

    return {
      dte,
      turnover,
      dteFormatted: dte.toFixed(2),
      turnoverFormatted: turnover.toFixed(2),
      summaryText,
      status,
    }
  }

  const renderMetricsAndSummary = (data: CompanyBalanceSheet[]) => {
    const metrics = calculateMetrics(data)

    return (
      <Reveal className="w-full flex flex-col space-y-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col text-left justify-between min-h-[115px]">
            <div className="flex flex-col space-y-1">
              <span className="text-band-muted uppercase font-bold text-caption tracking-widest font-mono">
                {t("balance.metric.dte")}
              </span>
              <span className="font-normal text-heading text-band-ink font-mono">
                {metrics.dteFormatted}
              </span>
            </div>
            <div className="w-full flex flex-col space-y-2 mt-3">
              <div className="w-full h-1 bg-band-raised rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${metrics.dte <= 1.5 ? "bg-band-gain" : metrics.dte <= 2.5 ? "bg-band-raised" : "bg-band-loss"}`}
                  style={{
                    width: `${Math.min(Math.max((metrics.dte / 3) * 100, 10), 100)}%`,
                  }}
                ></div>
              </div>
              <span className="text-caption text-band-muted font-normal font-mono">
                {t("balance.metric.dte.sub")}
              </span>
            </div>
          </div>

          <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col text-left justify-between min-h-[115px]">
            <div className="flex flex-col space-y-1">
              <span className="text-band-muted uppercase font-bold text-caption tracking-widest font-mono">
                {t("balance.metric.turnover")}
              </span>
              <span className="font-normal text-heading text-band-ink font-mono">
                {metrics.turnoverFormatted}
              </span>
            </div>
            <div className="w-full flex flex-col space-y-2 mt-3">
              <div className="w-full h-1 bg-band-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-border rounded-full"
                  style={{
                    width: `${Math.min(Math.max(metrics.turnover * 80, 15), 100)}%`,
                  }}
                ></div>
              </div>
              <span className="text-caption text-band-muted font-normal font-mono">
                {t("balance.metric.turnover.sub")}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-band-line/8 pb-3">
            <h4 className="text-body font-bold text-band-muted uppercase tracking-wider font-mono flex items-center gap-2">
              <svg
                className="w-4 h-4 text-band-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {t("balance.summary.title")}
            </h4>
            <span
              className={`text-caption font-bold uppercase px-2 py-1 rounded font-mono ${metrics.status === "STABLE"
                  ? "bg-band-gain/10 text-band-gain"
                  : metrics.status === "LEVERAGED"
                    ? "bg-band-loss/10 text-band-loss"
                    : "bg-band-raised text-band-muted"
                }`}
            >
              {t("balance.summary.badge", {
                status: t(("balance.status." + metrics.status) as TranslationKey),
              })}
            </span>
          </div>
          <p className="text-body text-band-ink leading-relaxed font-sans font-normal">
            {metrics.summaryText}
          </p>
        </div>
      </Reveal>
    )
  }

  return (
    <Band tone="cream" className="py-section">
      {balanceSheet ? (
        <div className="w-full flex flex-col">
          <div className="block w-full bg-band-surface shadow-xl rounded-card p-6 mb-6 ring-1 ring-inset ring-band-line/8 flex flex-col space-y-3 text-left">
            <h3 className="text-body-lg font-bold text-band-ink uppercase tracking-wider font-mono">
              {t("balance.explain.title")}
            </h3>
            <p className="text-band-ink text-body-lg font-normal leading-relaxed antialiased">
              {t("balance.explain.p1.a")}{" "}
              <strong className="text-band-ink font-normal">
                {t("balance.explain.p1.term")}
              </strong>{" "}
              {t("balance.explain.p1.b")}{" "}
              <strong className="text-band-muted">
                {t("balance.explain.p1.owns")}
              </strong>
              {t("balance.explain.p1.c")}{" "}
              <strong className="text-band-loss">
                {t("balance.explain.p1.owes")}
              </strong>
              {t("balance.explain.p1.d")}{" "}
              <strong className="text-band-muted">
                {t("balance.explain.p1.equity")}
              </strong>{" "}
              {t("balance.explain.p1.e")}
            </p>
            <p className="text-band-ink text-body font-normal leading-relaxed antialiased pt-1">
              <strong className="text-band-ink block mb-1 font-mono text-body uppercase tracking-wide">
                {t("balance.explain.why")}
              </strong>
              {t("balance.explain.p2")}
            </p>
          </div>

          <Table config={tableConfig} data={balanceSheet} />
          {renderMetricsAndSummary(balanceSheet)}
        </div>
      ) : (
        <Spinners />
      )}
    </Band>
  )
}

export default BalanceSheet
