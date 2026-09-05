import Reveal from "../Dashboard/Reveal"
import Band from "../Dashboard/Band"
import { isDemoTicker } from "../../Helpers/demoStocks"
import { useEffect, useState } from "react"
import type { CompanyIncomeStatement } from "../../company"
import { useOutletContext } from "react-router-dom"
import { getIncomeStatement } from "../../api"
import Table from "../Table/Table"
import Spinners from "../Spinners/Spinners"

import {
  formatLargeMonetaryNumber,
  formatRatio,
} from "../../Helpers/NumberFormatting"
import { useLanguage } from "../../i18n/useLanguage"
import type { TranslationKey } from "../../i18n/translations"

const configs = [
  {
    labelKey: "income.col.date",

    render: (company: CompanyIncomeStatement) => company.date,
  },

  {
    labelKey: "income.col.revenue",

    render: (company: CompanyIncomeStatement) =>
      formatLargeMonetaryNumber(company.revenue),
  },

  {
    labelKey: "income.col.costOfRevenue",

    render: (company: CompanyIncomeStatement) =>
      formatLargeMonetaryNumber(company.costOfRevenue),
  },

  {
    labelKey: "income.col.depreciation",

    render: (company: CompanyIncomeStatement) =>
      formatLargeMonetaryNumber(company.depreciationAndAmortization),
  },

  {
    labelKey: "income.col.operatingIncome",

    render: (company: CompanyIncomeStatement) =>
      formatLargeMonetaryNumber(company.operatingIncome),
  },

  {
    labelKey: "income.col.incomeBeforeTaxes",

    render: (company: CompanyIncomeStatement) =>
      formatLargeMonetaryNumber(company.incomeBeforeTax),
  },

  {
    labelKey: "income.col.netIncome",

    render: (company: CompanyIncomeStatement) =>
      formatLargeMonetaryNumber(company.netIncome),
  },

  {
    labelKey: "income.col.netIncomeRatio",

    render: (company: CompanyIncomeStatement) =>
      formatRatio(company.netIncomeRatio),
  },

  {
    labelKey: "income.col.eps",

    render: (company: CompanyIncomeStatement) => formatRatio(company.eps),
  },

  {
    labelKey: "income.col.epsDiluted",

    render: (company: CompanyIncomeStatement) =>
      formatRatio(company.epsdiluted),
  },

  {
    labelKey: "income.col.grossProfitRatio",

    render: (company: CompanyIncomeStatement) =>
      formatRatio(company.grossProfitRatio),
  },

  {
    labelKey: "income.col.operatingIncomeRatio",

    render: (company: CompanyIncomeStatement) =>
      formatRatio(company.operatingIncomeRatio),
  },

  {
    labelKey: "income.col.incomeBeforeTaxesRatio",

    render: (company: CompanyIncomeStatement) =>
      formatRatio(company.incomeBeforeTaxRatio),
  },
]

const IncomeStatement = () => {
  const ticker = useOutletContext<string>()
  const { t } = useLanguage()

  const tableConfig = configs.map(({ labelKey, render }) => ({
    label: t(labelKey as TranslationKey),
    render,
  }))

  const [incomeStatement, setIncomeStatement] =
    useState<CompanyIncomeStatement[]>()

  useEffect(() => {
    const incomeStatementFetch = async () => {
      const result = await getIncomeStatement(ticker)

      const sortedData = [...result.data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      setIncomeStatement(sortedData)
    }

    incomeStatementFetch()
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

  const calculateMetrics = (data: CompanyIncomeStatement[]) => {
    if (data.length < 2)
      return {
        margin: 0,
        growth: 0,
        marginFormatted: "0.0%",
        growthFormatted: "0.0%",
        summaryText: "",
        status: "NEUTRAL",
      }

    const latest = data[data.length - 1]

    const previous = data[data.length - 2]

    const margin = (latest.netIncome / latest.revenue) * 100

    const growth =
      ((latest.revenue - previous.revenue) / previous.revenue) * 100

    const vars = { growth: growth.toFixed(1), margin: margin.toFixed(1) }

    let status = "STRONG"
    let summaryText = t("income.summary.strong", vars)

    if (growth < 0 && margin < 10) {
      status = "WEAK"
      summaryText = t("income.summary.weak", vars)
    } else if (growth < 0 || margin < 10) {
      status = "MODERATE"
      summaryText = t("income.summary.moderate", vars)
    }

    return {
      margin,

      growth,

      marginFormatted: margin.toFixed(1) + "%",

      growthFormatted: (growth >= 0 ? "+" : "") + growth.toFixed(1) + "%",

      summaryText,

      status,
    }
  }

  const renderMetricsAndSummary = (data: CompanyIncomeStatement[]) => {
    const metrics = calculateMetrics(data)

    return (
      <Reveal className="w-full flex flex-col space-y-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col text-left justify-between min-h-[115px]">
            <div className="flex flex-col space-y-1">
              <span className="text-band-muted uppercase font-bold text-caption tracking-widest font-mono">
                {t("income.metric.margin")}
              </span>

              <span className="font-normal text-heading text-band-ink font-mono">
                {metrics.marginFormatted}
              </span>
            </div>

            <div className="w-full flex flex-col space-y-2 mt-3">
              <div className="w-full h-1 bg-band-raised rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-border rounded-full"
                  style={{
                    width: `${Math.min(Math.max(metrics.margin, 5), 100)}%`,
                  }}
                ></div>
              </div>

              <span className="text-caption text-band-muted font-normal font-mono">
                {t("income.metric.margin.sub")}
              </span>
            </div>
          </div>

          <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col text-left justify-between min-h-[115px]">
            <div className="flex flex-col space-y-1">
              <span className="text-band-muted uppercase font-bold text-caption tracking-widest font-mono">
                {t("income.metric.growth")}
              </span>

              <span
                className={`font-normal text-heading font-mono ${metrics.growth >= 0 ? "text-band-gain" : "text-band-loss"}`}
              >
                {metrics.growthFormatted}
              </span>
            </div>

            <div className="w-full flex flex-col space-y-2 mt-3">
              <div className="w-full h-1 bg-band-raised rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${metrics.growth >= 0 ? "bg-band-gain" : "bg-band-loss"}`}
                  style={{
                    width: `${Math.min(Math.max(Math.abs(metrics.growth) * 3, 10), 100)}%`,
                  }}
                ></div>
              </div>

              <span className="text-caption text-band-muted font-normal font-mono">
                {t("income.metric.growth.sub")}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card p-5 shadow-xl flex flex-col space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-band-line/8 pb-3">
            <h4 className="text-body font-bold text-band-muted uppercase tracking-wider font-mono flex items-center gap-2">
              <svg
                className="w-4 h-4 text-band-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {t("income.summary.title")}
            </h4>

            <span
              className={`text-caption font-bold uppercase px-2 py-1 rounded font-mono ${metrics.status === "STRONG"
                ? "bg-band-gain/10 text-band-gain"
                : metrics.status === "WEAK"
                  ? "bg-band-loss/10 text-band-loss"
                  : "bg-band-raised text-band-muted"
                }`}
            >
              {t("income.summary.badge", {
                status: t(("income.status." + metrics.status) as TranslationKey),
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
      {incomeStatement ? (
        <div className="w-full flex flex-col">
          <div className="block w-full bg-band-surface shadow-xl rounded-card p-6 mb-6 ring-1 ring-inset ring-band-line/8 flex flex-col space-y-3 text-left">
            <h3 className="text-body-lg font-bold text-band-ink uppercase tracking-wider font-mono">
              {t("income.explain.title")}
            </h3>

            <p className="text-band-ink text-body-lg font-normal leading-relaxed antialiased">
              {t("income.explain.p1.a")}{" "}
              <strong className="text-band-ink font-normal">
                {t("income.explain.p1.term")}
              </strong>{" "}
              {t("income.explain.p1.b")}{" "}
              <strong className="text-band-ink">
                {t("income.explain.p1.topline")}
              </strong>{" "}
              {t("income.explain.p1.c")}{" "}
              <strong className="text-band-muted">
                {t("income.explain.p1.bottomline")}
              </strong>
              .
            </p>

            <p className="text-band-ink text-body font-normal leading-relaxed antialiased pt-1">
              <strong className="text-band-ink block mb-1 font-mono text-body uppercase tracking-wide">
                {t("income.explain.why")}
              </strong>
              {t("income.explain.p2")}
            </p>
          </div>

          <Table config={tableConfig} data={incomeStatement} />

          {renderMetricsAndSummary(incomeStatement)}
        </div>
      ) : (
        <Spinners />
      )}
    </Band>
  )
}

export default IncomeStatement
