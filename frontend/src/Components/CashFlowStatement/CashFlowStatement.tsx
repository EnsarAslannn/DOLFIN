import Reveal from "../Dashboard/Reveal"
import Band from "../Dashboard/Band"
import { isDemoTicker } from "../../Helpers/demoStocks"
import { useEffect, useState } from 'react'
import type { CompanyCashFlow } from '../../company'
import { useOutletContext } from 'react-router'
import { getCashFlowStatement } from '../../api'
import Table from '../Table/Table'
import Spinners from '../Spinners/Spinners'
import { formatLargeMonetaryNumber } from '../../Helpers/NumberFormatting'
import { useLanguage } from "../../i18n/useLanguage"
import type { TranslationKey } from "../../i18n/translations"


const config = [
  {
    labelKey: "cashflow.col.date",
    render: (company: CompanyCashFlow) => company.date,
  },
  {
    labelKey: "cashflow.col.operating",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(company.operatingCashFlow),
  },
  {
    labelKey: "cashflow.col.investing",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(company.netCashUsedForInvestingActivites),
  },
  {
    labelKey: "cashflow.col.financing",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(
        company.netCashUsedProvidedByFinancingActivities
      ),
  },
  {
    labelKey: "cashflow.col.cashAtEnd",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(company.cashAtEndOfPeriod),
  },
  {
    labelKey: "cashflow.col.capex",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(company.capitalExpenditure),
  },
  {
    labelKey: "cashflow.col.issuance",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(company.commonStockIssued),
  },
  {
    labelKey: "cashflow.col.freeCashFlow",
    render: (company: CompanyCashFlow) =>
      formatLargeMonetaryNumber(company.freeCashFlow),
  },
];

const CashFlowStatement = () => {
  const ticker = useOutletContext<string>()
  const { t } = useLanguage()

  const tableConfig = config.map(({ labelKey, render }) => ({
    label: t(labelKey as TranslationKey),
    render,
  }))
  const [cashflowData, setCashflowData] = useState<CompanyCashFlow[]>()

  useEffect(() => {
    const fetchCashFlow = async () => {
      const result = await getCashFlowStatement(ticker!)
      const sortedData = [...result.data].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setCashflowData(sortedData)
    }
    fetchCashFlow()
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

  const calculateMetrics = (data: CompanyCashFlow[]) => {
    if (data.length === 0)
      return {
        cycle: 0,
        yieldValue: 0,
        cycleFormatted: t("cashflow.metric.days", { count: 0 }),
        yieldFormatted: "0.0%",
        summaryText: "",
        status: "NEUTRAL",
      }

    const latest = data[data.length - 1]

    const seed = ticker ? ticker.charCodeAt(0) % 20 + 35 : 45
    const cycle = Math.max(seed + (latest.operatingCashFlow > 100000000000 ? -12 : 8), 15)

    const yieldValue = latest.operatingCashFlow > 0 ? (latest.freeCashFlow / latest.operatingCashFlow) * 100 : 0

    const vars = { yield: yieldValue.toFixed(1), cycle: Math.round(cycle) }

    let status = "LIQUID"
    let summaryText = t("cashflow.summary.liquid", vars)

    if (yieldValue < 40) {
      status = "CAPEX_HEAVY"
      summaryText = t("cashflow.summary.capexHeavy", vars)
    }

    return {
      cycle,
      yieldValue,
      cycleFormatted: t("cashflow.metric.days", { count: Math.round(cycle) }),
      yieldFormatted: yieldValue.toFixed(1) + "%",
      summaryText,
      status
    }
  }

  const renderMetricsAndSummary = (data: CompanyCashFlow[]) => {
    const metrics = calculateMetrics(data)

    return (
      <Reveal className="w-full flex flex-col space-y-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col text-left justify-between min-h-[115px]">
            <div className="flex flex-col space-y-1">
              <span className="text-band-muted uppercase font-bold text-caption tracking-widest font-mono">{t("cashflow.metric.cycle")}</span>
              <span className="font-normal text-heading text-band-ink font-mono">{metrics.cycleFormatted}</span>
            </div>
            <div className="w-full flex flex-col space-y-2 mt-3">
              <div className="w-full h-1 bg-band-raised rounded-full overflow-hidden">
                <div className="h-full bg-band-raised rounded-full" style={{ width: `${Math.min(Math.max((metrics.cycle / 90) * 100, 15), 100)}%` }}></div>
              </div>
              <span className="text-caption text-band-muted font-normal font-mono">{t("cashflow.metric.cycle.sub")}</span>
            </div>
          </div>

          <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col text-left justify-between min-h-[115px]">
            <div className="flex flex-col space-y-1">
              <span className="text-band-muted uppercase font-bold text-caption tracking-widest font-mono">{t("cashflow.metric.yield")}</span>
              <span className="font-normal text-heading text-band-ink font-mono">{metrics.yieldFormatted}</span>
            </div>
            <div className="w-full flex flex-col space-y-2 mt-3">
              <div className="w-full h-1 bg-band-raised rounded-full overflow-hidden">
                <div className="h-full bg-slate-border rounded-full" style={{ width: `${Math.min(Math.max(metrics.yieldValue, 5), 100)}%` }}></div>
              </div>
              <span className="text-caption text-band-muted font-normal font-mono">{t("cashflow.metric.yield.sub")}</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-band-line/8 pb-3">
            <h4 className="text-body font-bold text-band-muted uppercase tracking-wider font-mono flex items-center gap-2">
              <svg className="w-4 h-4 text-band-muted" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("cashflow.summary.title")}
            </h4>
            <span className={`text-caption font-bold uppercase px-2 py-1 rounded font-mono ${metrics.status === "LIQUID" ? "bg-band-gain/10 text-band-gain" : "bg-band-raised text-band-muted"
              }`}>
              {t("cashflow.summary.badge", {
                status: t(("cashflow.status." + metrics.status) as TranslationKey),
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
      {cashflowData ? (
        <div className="w-full flex flex-col">

          <div className="block w-full bg-band-surface shadow-xl rounded-card p-6 mb-6 ring-1 ring-inset ring-band-line/8 flex flex-col space-y-3 text-left">
            <h3 className="text-body-lg font-bold text-band-ink uppercase tracking-wider font-mono">
              {t("cashflow.explain.title")}
            </h3>
            <p className="text-band-ink text-body-lg font-normal leading-relaxed antialiased">
              {t("cashflow.explain.p1.a")}{" "}
              <strong className="text-band-ink font-normal">
                {t("cashflow.explain.p1.term")}
              </strong>{" "}
              {t("cashflow.explain.p1.b")}{" "}
              <strong className="text-band-ink">
                {t("cashflow.explain.p1.operating")}
              </strong>{" "}
              {t("cashflow.explain.p1.operating.note")}{" "}
              <strong className="text-band-muted">
                {t("cashflow.explain.p1.investing")}
              </strong>{" "}
              {t("cashflow.explain.p1.investing.note")}{" "}
              <strong className="text-band-ink">
                {t("cashflow.explain.p1.financing")}
              </strong>{" "}
              {t("cashflow.explain.p1.financing.note")}
            </p>
            <p className="text-band-ink text-body font-normal leading-relaxed antialiased pt-1">
              <strong className="text-band-ink block mb-1 font-mono text-body uppercase tracking-wide">
                {t("cashflow.explain.why")}
              </strong>
              {t("cashflow.explain.p2.a")}{" "}
              <strong className="text-band-ink">
                {t("cashflow.explain.p2.fcf")}
              </strong>{" "}
              {t("cashflow.explain.p2.b")}
            </p>
          </div>

          <Table config={tableConfig} data={cashflowData} />
          {renderMetricsAndSummary(cashflowData)}
        </div>
      ) : (
        <Spinners />
      )}
    </Band>
  )
}

export default CashFlowStatement