import { useEffect, useState } from "react"
import type { CompanyTenK } from "../../company"
import { getTenK } from "../../api"
import TenKFinderItem from "./TenKFinderItem/TenKFinderItem"
import Spinners from "../Spinners/Spinners"
import { useLanguage } from "../../i18n/useLanguage"

type Props = {
  ticker: string
}

const TenKFinder = ({ ticker }: Props) => {
  const { t } = useLanguage()
  const [companyData, setCompanyData] = useState<CompanyTenK[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const getTenKData = async () => {
      setIsLoading(true)
      const value = await getTenK(ticker)
      setCompanyData(value.data)
      setIsLoading(false)
    }
    getTenKData()
  }, [ticker])

  return (
    <div className="flex flex-wrap items-center gap-2 m-2">
      {isLoading ? (
        <Spinners />
      ) : companyData && companyData.length > 0 ? (
        companyData.slice(0, 5).map((tenK, index) => {
          return (
            <TenKFinderItem
              key={`tenk-report-${ticker}-${index}`}
              tenK={tenK}
            />
          )
        })
      ) : (
        <span className="text-body font-normal text-band-muted font-mono">
          {t("company.filings.none")}
        </span>
      )}
    </div>
  )
}

export default TenKFinder
