import { isDemoTicker } from "../../Helpers/demoStocks"
import { useEffect, useState } from "react"
import { useParams, Outlet } from "react-router"
import type { CompanyProfile } from "../../company"
import { getCompanyProfile } from "../../api"
import Sidebar from "../../Components/Sidebar/Sidebar"
import CompanyDashboard from "../../Components/CompanyDashboard/CompanyDashboard"
import ProfileHeader from "../../Components/Dashboard/ProfileHeader"
import Spinners from "../../Components/Spinners/Spinners"
import Band from "../../Components/Dashboard/Band"
import { formatLargeNonMonetaryNumber } from "../../Helpers/NumberFormatting"
import { useLanguage } from "../../i18n/useLanguage"


const CompanyPage = () => {
  const { ticker } = useParams()
  const { t } = useLanguage()
  const [company, setCompany] = useState<CompanyProfile>()

  useEffect(() => {
    if (!isDemoTicker(ticker)) return

    const getProfileInit = async () => {
      const result = await getCompanyProfile(ticker!)
      setCompany(result?.data[0])
    }
    getProfileInit()
  }, [ticker])

  if (!isDemoTicker(ticker)) {
    return (
      <div className="w-full relative flex ct-docs-disable-sidebar-content overflow-x-hidden bg-onyx-canvas text-band-ink min-h-screen">
        <Sidebar />
        <CompanyDashboard>
          <Band tone="dark" className="py-section">
          <div className="rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 w-full rounded-card p-8 flex flex-col items-center justify-center text-center min-h-[450px] space-y-4 my-4 animate-fadeIn">
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
          </Band>
        </CompanyDashboard>
      </div>
    )
  }

  const renderMarketCap = (mktCap: number) => {
    const formatted = String(formatLargeNonMonetaryNumber(mktCap) ?? mktCap)
    if (formatted.endsWith("M") || formatted.endsWith("B") || formatted.endsWith("T")) {
      return "$" + formatted
    }
    return "$" + formatted + "T"
  }

  return (
    <>
      {company ? (
        <div className="w-full relative flex ct-docs-disable-sidebar-content overflow-x-hidden bg-onyx-canvas text-band-ink min-h-screen">
          <Sidebar />

          <CompanyDashboard>
            <Band tone="dark" className="pb-section pt-10">
            <ProfileHeader
              symbol={company.symbol}
              companyName={company.companyName}
              sector={company.sector}
              industry={company.industry}
              exchange={company.exchangeShortName}
              metrics={[
                {
                  label: t("company.metric.price"),
                  value: "$" + company.price.toFixed(2),
                },
                {
                  label: t("company.metric.change"),
                  value:
                    (company.changes >= 0 ? "+" : "") +
                    company.changes.toFixed(2),
                  tone: company.changes >= 0 ? "gain" : "loss",
                },
                {
                  label: t("company.metric.marketCap"),
                  value: renderMarketCap(company.mktCap),
                },
                {
                  label: t("company.metric.beta"),
                  value: company.beta?.toFixed(2) ?? "—",
                },
              ]}
            />

            </Band>

            <Outlet context={ticker} />

          </CompanyDashboard>
        </div>
      ) : (
        <div className="w-full min-h-screen bg-onyx-canvas flex items-center justify-center">
          <Spinners />
        </div>
      )}
    </>
  )
}

export default CompanyPage