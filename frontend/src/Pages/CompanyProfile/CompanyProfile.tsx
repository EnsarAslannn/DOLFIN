import { useEffect, useState, type ReactNode } from "react"
import { useOutletContext } from "react-router"
import type { CompanyKeyMetrics, CompanyProfile as CompanyProfileType } from "../../company"
import { getKeyMetrics, getCompanyProfile } from "../../api"
import RatioList from "../../Components/RatioList/RatioList"
import Spinners from "../../Components/Spinners/Spinners"
import ComparableFinder from "../../Components/ComparableFinder/ComparableFinder"
import TenKFinder from "../../Components/TenKFinder/TenKFinder"
import Panel, { PanelHeader } from "../../Components/Dashboard/Panel"
import Band from "../../Components/Dashboard/Band"
import EmptyState from "../../Components/Dashboard/EmptyState"
import { Link } from "react-router-dom"
import {
  formatLargeNonMonetaryNumber,
  formatRatio,
} from "../../Helpers/NumberFormatting"
import { useLanguage } from "../../i18n/useLanguage"
import type { TranslationKey } from "../../i18n/translations"

// Each row pairs a metric key with the field it reads, so the labels can be
// looked up per language while the renderers stay put.
const RATIO_ROWS: {
  key: string
  render: (company: CompanyKeyMetrics) => ReactNode
}[] = [
  {
    key: "marketCap",
    render: (company) => formatLargeNonMonetaryNumber(company.marketCapTTM),
  },
  { key: "currentRatio", render: (company) => formatRatio(company.currentRatioTTM) },
  { key: "roe", render: (company) => formatRatio(company.roeTTM) },
  {
    key: "roa",
    render: (company) => formatRatio(company.returnOnTangibleAssetsTTM),
  },
  {
    key: "fcfPerShare",
    render: (company) => formatRatio(company.freeCashFlowPerShareTTM),
  },
  {
    key: "bookValue",
    render: (company) => formatRatio(company.bookValuePerShareTTM),
  },
  {
    key: "dividendYield",
    render: (company) => formatRatio(company.dividendYieldTTM),
  },
  { key: "capex", render: (company) => formatRatio(company.capexPerShareTTM) },
  { key: "graham", render: (company) => formatRatio(company.grahamNumberTTM) },
  { key: "pe", render: (company) => formatRatio(company.peRatioTTM) },
]

const CompanyProfile = () => {
  const ticker = useOutletContext<string>()
  const { t } = useLanguage()

  const tableConfig = RATIO_ROWS.map((row) => ({
    label: t(`ratio.${row.key}` as TranslationKey),
    subTitle: t(`ratio.${row.key}.sub` as TranslationKey),
    render: row.render,
  }))
  const [companyData, setCompanyData] = useState<CompanyKeyMetrics>()
  const [profile, setProfile] = useState<CompanyProfileType | null>(null)

  useEffect(() => {
    const getProfileData = async () => {
      const pResult = await getCompanyProfile(ticker)
      setProfile(pResult.data[0] ?? null)

      const mResult = await getKeyMetrics(ticker)
      setCompanyData(mResult.data[0])
    }
    getProfileData()
  }, [ticker])

  const allowedStocks = ["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL"]

  if (!allowedStocks.includes(ticker?.toUpperCase())) {
    return (
      <Band tone="dark" className="py-section">
      <EmptyState
        variant="search"
        title={t("company.noData.title")}
        description={t("company.noData.description", {
          ticker: ticker?.toUpperCase() ?? "",
        })}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {allowedStocks.map((allowed) => (
            <Link
              key={allowed}
              to={`/company/${allowed}/company-profile`}
              className="rounded-pill bg-band-raised px-4 py-2 font-mono text-caption font-normal uppercase tracking-label-sm text-band-muted transition-colors duration-200 hover:bg-cobalt hover:text-pure-white"
            >
              {allowed}
            </Link>
          ))}
        </div>
      </EmptyState>
      </Band>
    )
  }

  if (!profile || !companyData) {
    return (
      <Band tone="dark" className="py-section">
        <Spinners variant="inline" label={t("company.loading")} />
      </Band>
    )
  }

  return (
    <>
      <Band tone="cream" className="py-section">
        <div className="flex w-full flex-col gap-14 font-sans text-band-ink">

      <Panel>
        <PanelHeader
          eyebrow={t("company.overview.eyebrow")}
          title={t("company.overview.title")}
        />
        <p className="mt-6 text-body-lg font-normal leading-relaxed text-band-muted xl:columns-2 xl:gap-16">
          {profile.description}
        </p>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow={t("company.metrics.eyebrow")}
          title={t("company.metrics.title")}
          className="mb-6"
        />
        <RatioList data={companyData} config={tableConfig} />
      </Panel>
        </div>
      </Band>

      <Band tone="dark" className="py-section">
        <div className="flex w-full flex-col gap-14 font-sans text-band-ink">
      <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            eyebrow={t("company.peers.eyebrow")}
            title={t("company.peers.title")}
            lead={t("company.peers.lead")}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <ComparableFinder ticker={profile.symbol} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow={t("company.filings.eyebrow")}
            title={t("company.filings.title")}
            lead={t("company.filings.lead")}
          />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <TenKFinder ticker={profile.symbol} />
          </div>
        </Panel>
      </div>
        </div>
      </Band>
    </>
  )
}

export default CompanyProfile
