import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react"
import Search from "../../Components/Search/Search"
import ListPortfolio from "../../Components/Portfolio/ListPortfolio/ListPortfolio"
import CardList from "../../Components/CardList/CardList"
import type { PortfolioGet } from "../../Models/Portfolio"
import type { StockSearchResult } from "../../Models/StockSearchResult"
import Band from "../../Components/Dashboard/Band"
import Reveal, { RevealGroup, RevealItem } from "../../Components/Dashboard/Reveal"
import { PanelHeader } from "../../Components/Dashboard/Panel"
import {
  portfolioAddAPI,
  portfolioSellAPI,
  portfolioGetAPI,
} from "../../Services/PortfolioService"
import { toast } from "react-toastify"
import Tile from "../../Components/Tile/Tile"
import MarketTicker from "../../Components/MarketTicker/MarketTicker"
import StockComment from "../../Components/StockComment/StockComment"
import { useAuth } from "../../Context/useAuth"
import { searchStocksAPI } from "../../Services/StockService"
import PurchasePortfolio from "../../Components/Portfolio/PurchasePortfolio/PurchasePortfolio"
import GuestCallout from "../../Components/Dashboard/GuestCallout"
import { useLanguage } from "../../i18n/useLanguage"
import type { TranslationKey } from "../../i18n/translations"

const SearchPage = () => {
  const { user, updateWalletBalance } = useAuth()
  const { t } = useLanguage()
  const [search, setSearch] = useState<string>("")
  const [searchResult, setSearchResult] = useState<StockSearchResult[]>([])
  const [serverError, setServerError] = useState<string>("")
  const [portfolioValues, setPortfolioValues] = useState<PortfolioGet[] | null>([])
  const [activePanel, setActivePanel] = useState<"worth" | "health" | "sector" | null>(null)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<"BUY" | "SELL">("BUY")
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; price: number; maxQuantity?: number } | null>(null)

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const getPortfolio = useCallback(() => {
    portfolioGetAPI()
      .then((res) => {
        if (res?.data) {
          setPortfolioValues(res?.data)
        }
      })
      .catch((e) => {
        console.error(e)
        toast.warning(t("search.toast.portfolioFailed"))
      })
  }, [t])

  useEffect(() => {
    if (user) {
      getPortfolio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userName])

  const onPortfolioCreateTrigger = (e: SyntheticEvent) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const symbol = (form.elements[0] as HTMLInputElement).value
    const matchedStock = searchResult.find(
      (s) => (s.symbol || s.Symbol || "").toUpperCase() === symbol.toUpperCase()
    )
    const price = matchedStock ? (matchedStock.purchase || matchedStock.Purchase || 0) : 0

    setModalMode("BUY")
    setSelectedStock({ symbol, price })
    setIsModalOpen(true)
  }

  const handleConfirmTrade = (quantity: number) => {
    if (!selectedStock) return

    if (modalMode === "BUY") {
      portfolioAddAPI(selectedStock.symbol, quantity)
        .then((res) => {
          if (res && res.status >= 200 && res.status < 300) {
            toast.success(t("search.toast.bought"))
            if (res.data?.newBalance !== undefined) {
              updateWalletBalance(res.data.newBalance)
            }
            setIsModalOpen(false)
            setSelectedStock(null)
            getPortfolio()
          }
        })
        .catch((e) => {
          console.error(e)
          toast.warning(t("search.toast.buyFailed"))
        })
    } else {
      portfolioSellAPI(selectedStock.symbol, quantity)
        .then((res) => {
          if (res && res.status >= 200 && res.status < 300) {
            toast.success(t("search.toast.sold"))
            if (res.data?.newBalance !== undefined) {
              updateWalletBalance(res.data.newBalance)
            }
            setIsModalOpen(false)
            setSelectedStock(null)
            getPortfolio()
          }
        })
        .catch((e) => {
          console.error(e)
          toast.warning(t("search.toast.sellFailed"))
        })
    }
  }

  const onPortfolioDelete = (e: SyntheticEvent) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const targetSymbol = (form.elements[0] as HTMLInputElement).value

    const matchedOwned = portfolioValues?.find(
      (p) => p.symbol.toUpperCase() === targetSymbol.toUpperCase()
    )
    if (!matchedOwned) return

    setModalMode("SELL")
    setSelectedStock({
      symbol: matchedOwned.symbol,
      price: matchedOwned.purchase || 0,
      maxQuantity: matchedOwned.quantity || 0
    })
    setIsModalOpen(true)
  }

  const onSearchSubmit = async (e: SyntheticEvent, overrideQuery?: string) => {
    e.preventDefault()

    const queryValue = (overrideQuery ?? search).trim()
    if (!queryValue) return

    try {
      const results = await searchStocksAPI(queryValue)

      setSearchResult(results)
      setServerError("")
    } catch (error) {
      console.error("Search API Error:", error)
      setServerError(t("search.error.offline"))
      toast.error(t("search.toast.searchFailed"))
    }
  }

  const calculateStocksValue = () => {
    if (!portfolioValues) return 0
    return portfolioValues.reduce((total, item) => {
      const livePrice = item.purchase || 0
      const quantity = item.quantity || 0
      return total + (livePrice * quantity)
    }, 0)
  }

  const cashBalance = user?.walletBalance || 0
  const stocksValue = calculateStocksValue()
  const estimatedTotalValue = cashBalance + stocksValue

  // Banded by how many positions are held; the band selects the copy, so the
  // wording follows the language instead of being frozen at English.
  const getPortfolioHealthDetails = () => {
    const count = portfolioValues?.length ?? 0
    const band =
      count === 0
        ? "empty"
        : count === 1
          ? "concentrated"
          : count <= 3
            ? "diversifying"
            : "safe"

    return {
      status: t(`search.health.${band}.status` as TranslationKey),
      description: t(`search.health.${band}.description` as TranslationKey),
    }
  }

  const getSectorAllocation = () => {
    if (!portfolioValues || portfolioValues.length === 0) {
      return {
        primarySector: t("search.sector.none"),
        techPercent: 0,
        otherPercent: 0,
      }
    }
    let techTotal = 0
    let otherTotal = 0
    let lastFoundSector = t("search.sector.technology")

    portfolioValues.forEach((item) => {
      const livePrice = item.purchase || 0
      const quantity = item.quantity || 0
      const totalAssetValue = livePrice * quantity

      if (item.industry?.toLowerCase().includes("software") || item.industry?.toLowerCase().includes("semiconductors") || item.industry?.toLowerCase().includes("technology")) {
        techTotal += totalAssetValue
      } else {
        otherTotal += totalAssetValue
        if (item.industry) lastFoundSector = item.industry
      }
    })

    const grandTotal = techTotal + otherTotal
    if (grandTotal === 0)
      return {
        primarySector: t("search.sector.none"),
        techPercent: 0,
        otherPercent: 0,
      }

    const techPercent = Math.round((techTotal / grandTotal) * 100)
    const otherPercent = Math.round((otherTotal / grandTotal) * 100)
    const primarySector =
      techTotal >= otherTotal ? t("search.sector.technology") : lastFoundSector

    return { primarySector, techPercent, otherPercent }
  }

  const togglePanel = (panelName: "worth" | "health" | "sector") => {
    if (activePanel === panelName) {
      setActivePanel(null)
    } else {
      setActivePanel(panelName)
    }
  }

  const sectorData = getSectorAllocation()
  const healthDetails = getPortfolioHealthDetails()
  const portfolioHealth = healthDetails.status

  const timelineData = [
    { date: "Jan 26", val: estimatedTotalValue * 0.8 },
    { date: "Feb 26", val: estimatedTotalValue * 0.88 },
    { date: "Mar 26", val: estimatedTotalValue * 0.85 },
    { date: "Apr 26", val: estimatedTotalValue * 0.95 },
    { date: "May 26", val: estimatedTotalValue * 0.92 },
    { date: "Jun 26", val: estimatedTotalValue },
  ]

  const maxVal = Math.max(...timelineData.map(t => t.val), 1)
  const minVal = Math.min(...timelineData.map(t => t.val), 0)

  const points = timelineData.map((t, idx) => {
    const x = idx * 100
    const y = maxVal === minVal ? 75 : 135 - ((t.val - minVal) / (maxVal - minVal)) * 120
    return { x, y, raw: t }
  })

  const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} 150 L 0 150 Z`

  return (
    <div className="min-h-screen w-full bg-onyx-canvas font-sans">
      <div className="w-full pt-16">
        <MarketTicker />
      </div>

      <Band tone="dark" className="pb-16 pt-12">
        <Reveal className="flex flex-col gap-9">
          <div>
            <span className="block font-mono text-caption font-normal uppercase tracking-label-lg text-band-subtle">
              {t("search.eyebrow")}
            </span>
            <h1 className="mt-3 text-heading font-medium text-band-ink md:text-heading-lg">
              {t("search.title")}
            </h1>
            <p className="mt-3 max-w-[60ch] text-body-lg font-normal text-band-muted">
              {user ? t("search.lead.user") : t("search.lead.guest")}
            </p>
          </div>

          <Search
            onSearchSubmit={onSearchSubmit}
            search={search}
            handleSearchChange={handleSearchChange}
          />
        </Reveal>
      </Band>

      <Band tone="cream" className="py-section">
        <section className="flex flex-col gap-8">
          <Reveal>
            <PanelHeader
              eyebrow={t("search.results.eyebrow")}
              title={t("search.results.title")}
              actions={
                searchResult.length > 0 ? (
                  <span className="font-mono text-caption font-normal uppercase tracking-label-sm text-band-subtle">
                    {t(
                      searchResult.length === 1
                        ? "search.results.count.one"
                        : "search.results.count.other",
                      { count: searchResult.length },
                    )}
                  </span>
                ) : undefined
              }
            />
          </Reveal>
          <CardList
            searchResults={searchResult}
            onPortfolioCreate={onPortfolioCreateTrigger}
            hasSearched={Boolean(search.trim())}
          />
        </section>
      </Band>

      <Band tone="dark" className="py-section">
        <div className="flex w-full flex-col gap-16">
            {!user && (
              <GuestCallout
                title={t("search.guest.title")}
                description={t("search.guest.description")}
              />
            )}

            {user && (
              <ListPortfolio
                portfolioValues={portfolioValues!}
                onPortfolioDelete={onPortfolioDelete}
              />
            )}

            {user && portfolioValues && (
              <div className="flex w-full flex-col gap-6">
                <Reveal>
                  <PanelHeader
                    eyebrow={t("search.analytics.eyebrow")}
                    title={t("search.analytics.title")}
                  />
                </Reveal>
                <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <RevealItem>
                  <button type="button" onClick={() => togglePanel("worth")} className="cursor-pointer text-left w-full">
                    <Tile
                      variant="netWorth"
                      title={t("search.tile.netWorth")}
                      subTitle={`$${estimatedTotalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                  </button>
                  </RevealItem>
                  <RevealItem>
                  <button type="button" onClick={() => togglePanel("health")} className="cursor-pointer text-left w-full">
                    <Tile
                      variant="health"
                      title={t("search.tile.health")}
                      subTitle={portfolioHealth}
                    />
                  </button>
                  </RevealItem>
                  <RevealItem>
                  <button type="button" onClick={() => togglePanel("sector")} className="cursor-pointer text-left w-full">
                    <Tile
                      variant="sector"
                      title={t("search.tile.sector")}
                      subTitle={sectorData.primarySector}
                    />
                  </button>
                  </RevealItem>
                </RevealGroup>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${activePanel === "worth" ? "max-h-[350px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}
                >
                  <div className="w-full rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 p-6 flex flex-col space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-band-line/8 pb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-band-ink tracking-tight">
                          {t("search.worth.title")}
                        </span>
                        <span className="text-caption text-band-muted font-normal mt-1">
                          {t("search.worth.subtitle")}
                        </span>
                      </div>
                      <span className="text-caption font-bold text-band-gain bg-band-gain/10 px-2 py-1 rounded border border-band-gain/20">
                        {t("search.worth.badge")}
                      </span>
                    </div>

                    <div className="w-full h-44 relative pt-4 flex items-end">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-l border-b border-band-line/8 pb-6 pl-2">
                        <div className="w-full border-t border-band-line/8 text-caption font-bold font-mono text-band-muted pt-1 text-right">
                          ${maxVal.toFixed(0)}
                        </div>
                        <div className="w-full border-t border-band-line/8 text-caption font-bold font-mono text-band-muted pt-1 text-right">
                          ${((maxVal + minVal) / 2).toFixed(0)}
                        </div>
                        <div className="w-full text-caption font-bold font-mono text-band-muted text-right">
                          ${minVal.toFixed(0)}
                        </div>
                      </div>

                      <svg viewBox="0 0 500 150" className="w-full h-full pr-4 pl-8 z-10 overflow-visible">
                        <defs>
                          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ec98a" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4ec98a" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={pathD}
                          className="stroke-band-gain stroke-2 fill-none "
                        />
                        <path
                          d={areaD}
                          fill="url(#chartGlow)"
                        />
                        {points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? "4" : "2"} className="fill-band-gain" />
                        ))}
                      </svg>
                    </div>

                    <div className="grid grid-cols-6 text-center text-caption font-bold text-band-muted font-mono pl-8 pr-4">
                      {timelineData.map((t, idx) => (
                        <div key={idx} className="flex flex-col space-y-1">
                          <span>{t.date}</span>
                          <span className="text-band-muted text-caption font-normal">
                            ${t.val.toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${activePanel === "health" ? "max-h-[350px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}
                >
                  <div className="w-full rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 p-6 flex flex-col space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-band-line/8 pb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-band-ink tracking-tight">
                          {t("search.health.title")}
                        </span>
                        <span className="text-caption text-band-muted font-normal mt-1">
                          {t("search.health.subtitle")}
                        </span>
                      </div>
                      <span className={`text-caption font-bold bg-band-raised px-2 py-1 rounded border ${portfolioValues && portfolioValues.length > 3 ? "text-band-gain border-band-gain/20" : "text-band-muted border-band-line/10"
                        }`}>
                        {t("search.health.strategy", { status: portfolioHealth })}
                      </span>
                    </div>
                    <div className="bg-band-raised p-5 rounded-card ring-1 ring-inset ring-band-line/8 leading-relaxed">
                      <p className="text-xs font-bold text-band-muted mb-2 uppercase tracking-wider font-mono">
                        {t("search.health.analysisLabel")}
                      </p>
                      <p className="text-sm text-band-ink font-normal tracking-normal leading-6">
                        {healthDetails.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${activePanel === "sector" ? "max-h-[350px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}`}
                >
                  <div className="w-full rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 p-6 flex flex-col space-y-5 text-left">
                    <div className="flex items-center justify-between border-b border-band-line/8 pb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-band-ink tracking-tight">
                          {t("search.sector.title")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 pt-1">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between text-caption font-bold text-band-muted font-mono">
                          <span>{t("search.sector.tech")}</span>
                          <span>{sectorData.techPercent}.00%</span>
                        </div>
                        <div className="w-full h-1.5 bg-band-raised rounded-full overflow-hidden">
                          <div
                            className="h-full bg-band-surface rounded-full"
                            style={{ width: `${sectorData.techPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between text-caption font-bold text-band-muted font-mono">
                          <span>
                            {t("search.sector.other", {
                              sector: sectorData.primarySector,
                            })}
                          </span>
                          <span>{sectorData.otherPercent}.00%</span>
                        </div>
                        <div className="w-full h-1.5 bg-band-raised rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-border rounded-full"
                            style={{ width: `${sectorData.otherPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {serverError && (
            <div className="rounded-card border border-band-loss/30 bg-band-loss/10 p-4 text-center font-normal text-band-loss">
              {serverError}
            </div>
          )}
        </div>
      </Band>

      <Band tone="cream" className="py-section">
        <StockComment />
      </Band>


      {selectedStock && (
        <PurchasePortfolio
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedStock(null)
          }}
          onConfirm={handleConfirmTrade}
          stockSymbol={selectedStock.symbol}
          stockPrice={selectedStock.price}
          walletBalance={user?.walletBalance || 0}
          mode={modalMode}
          maxOwnedQuantity={selectedStock.maxQuantity}
        />
      )}
    </div>
  )
}

export default SearchPage