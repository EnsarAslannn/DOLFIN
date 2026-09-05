import { useState, useEffect } from "react"
import { getCompanyPeers } from "../../api"
import CompFinderItem from "./CompFinderItem/CompFinderItem"
import Spinners from "../Spinners/Spinners"
import { useLanguage } from "../../i18n/useLanguage"

type Props = {
  ticker: string
}

const ComparableFinder = ({ ticker }: Props) => {
  const { t } = useLanguage()
  const [companyPeers, setCompanyPeers] = useState<unknown>(null)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchPeers = async () => {
      setIsLoading(true)

      const result = await getCompanyPeers(ticker)

      setCompanyPeers(result.data)

      setIsLoading(false)
    }

    fetchPeers()
  }, [ticker])

  return (
    <div className="flex flex-wrap gap-2 m-2">
      {isLoading ? (
        <Spinners />
      ) : companyPeers &&
        Array.isArray(companyPeers) &&
        companyPeers.length > 0 ? (
        companyPeers.slice(0, 6).map((peerTicker) => {
          return <CompFinderItem key={peerTicker} ticker={peerTicker} />
        })
      ) : companyPeers &&
        typeof companyPeers === "object" &&
        "peersList" in companyPeers &&
        Array.isArray(companyPeers.peersList) ? (
        (companyPeers.peersList as string[]).slice(0, 6).map((peerTicker) => {
          return <CompFinderItem key={peerTicker} ticker={peerTicker} />
        })
      ) : (
        <span className="text-body font-normal text-band-muted font-mono">
          {t("company.peers.none")}
        </span>
      )}
    </div>
  )
}

export default ComparableFinder
