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
import { searchStocksBySymbolAPI, searchStocksByCompanyNameAPI } from "../../Services/StockService"
import PurchasePortfolio from "../../Components/Portfolio/PurchasePortfolio/PurchasePortfolio"
import GuestCallout from "../../Components/Dashboard/GuestCallout"

const SearchPage = () => {
  const { user, updateWalletBalance } = useAuth()
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
        toast.warning("Could not get portfolio values!")
      })
  }, [])

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
            toast.success("Stock purchased successfully!")
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
          toast.warning("Could not create portfolio item!")
        })
    } else {
      portfolioSellAPI(selectedStock.symbol, quantity)
        .then((res) => {
          if (res && res.status >= 200 && res.status < 300) {
            toast.success("Stock sold successfully!")
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
          toast.warning("Transaction execution failed!")
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
      const response = queryValue.length <= 5
        ? await searchStocksBySymbolAPI(queryValue.toUpperCase())
        : await searchStocksByCompanyNameAPI(queryValue)

      if (response && Array.isArray(response.data)) {
        setSearchResult(response.data)
        setServerError("")
      }
    } catch (error) {
      console.error("Search API Error:", error)
      setServerError("Unable to connect to local API server")
      toast.error("Could not fetch search results from local server!")
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

  const getPortfolioHealthDetails = () => {
    if (!portfolioValues || portfolioValues.length === 0) {
      return {
        status: "Empty Portfolio",
        description: "Your capital is currently completely unallocated in the equities market, resting fully in cash assets. While this strategy completely mitigates market volatility and systemic equity risk, it exposes your capital to purchasing power degradation via inflation. Consider initiating structural positions across uncorrelated assets to build a baseline risk-adjusted compounding framework."
      }
    }

    if (portfolioValues.length === 1) {
      return {
        status: "Concentrated Risk",
        description: "Your portfolio exhibits maximum idiosyncratic risk due to total asset concentration in a single equity instrument. Under standard Modern Portfolio Theory (MPT), this specific allocation configuration exposes your entire capital to unhedged corporate volatility and sector-specific shocks. To optimize your Sharpe ratio and build systemic resilience, consider liquidating marginal portions to diversify into low-correlation industries."
      }
    }

    if (portfolioValues.length <= 3) {
      return {
        status: "Diversifying",
        description: "Your asset layout indicates an active transition toward a balanced model, demonstrating a structured mitigation of individual asset beta. While you have successfully eliminated absolute concentration risk, your portfolio's macroeconomic sensitivity remains tied to specific cluster movements. Fine-tuning your variance through international equities or contrasting industrial sectors will further secure equity insulation during broader market drawdowns."
      }
    }

    return {
      status: "Highly Safe",
      description: "Your capital structure possesses institutional-grade diversification, effectively minimizing idiosyncratic risk factors across multiple moving parameters. The variance of your equity distribution successfully counteracts isolated sector contractions, optimizing long-term capital preservation metrics. Maintain periodic capital rebalancing schedules to ensure asset weight drifts do not inadvertently distort your target alpha-to-risk boundary parameters."
    }
  }

  const getSectorAllocation = () => {
    if (!portfolioValues || portfolioValues.length === 0) {
      return { primarySector: "None", techPercent: 0, otherPercent: 0 }
    }
    let techTotal = 0
    let otherTotal = 0
    let lastFoundSector = "Technology"

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
    if (grandTotal === 0) return { primarySector: "None", techPercent: 0, otherPercent: 0 }

    const techPercent = Math.round((techTotal / grandTotal) * 100)
    const otherPercent = Math.round((otherTotal / grandTotal) * 100)
    const primarySector = techTotal >= otherTotal ? "Technology" : lastFoundSector

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
              Search
            </span>
            <h1 className="mt-3 text-heading font-medium text-band-ink md:text-heading-lg">
              Find a company
            </h1>
            <p className="mt-3 max-w-[60ch] text-body-lg font-normal text-band-muted">
              {user
                ? "Look up any listed ticker to read its fundamentals, then add it to your portfolio."
                : "Look up any listed ticker and read its fundamentals. Browsing is open — an account is only needed to trade."}
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
              eyebrow="Results"
              title="Matching companies"
              actions={
                searchResult.length > 0 ? (
                  <span className="font-mono text-caption font-normal uppercase tracking-label-sm text-band-subtle">
                    {searchResult.length} match
                    {searchResult.length === 1 ? "" : "es"}
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
                title="Trading needs an account"
                description="Search, fundamentals and the discussion are open to everyone. Opening a wallet gives you a starting balance to trade with, unrealized profit and loss on every position, and price alerts that watch a level for you."
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
                  <PanelHeader eyebrow="Analytics" title="Portfolio analytics" />
                </Reveal>
                <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <RevealItem>
                  <button type="button" onClick={() => togglePanel("worth")} className="cursor-pointer text-left w-full">
                    <Tile title="Total Net Worth" subTitle={`$${estimatedTotalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  </button>
                  </RevealItem>
                  <RevealItem>
                  <button type="button" onClick={() => togglePanel("health")} className="cursor-pointer text-left w-full">
                    <Tile title="Portfolio Health" subTitle={portfolioHealth} />
                  </button>
                  </RevealItem>
                  <RevealItem>
                  <button type="button" onClick={() => togglePanel("sector")} className="cursor-pointer text-left w-full">
                    <Tile title="Primary Sector" subTitle={sectorData.primarySector} />
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
                          Net Worth Growth Timeline
                        </span>
                        <span className="text-caption text-band-muted font-normal mt-1">
                          Live historical context based on wallet & asset capitalization
                        </span>
                      </div>
                      <span className="text-caption font-bold text-band-gain bg-band-gain/10 px-2 py-1 rounded border border-band-gain/20">
                        All-Time High
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
                          Portfolio Risk & Diversification Audit
                        </span>
                        <span className="text-caption text-band-muted font-normal mt-1">
                          Quantifying capital exposure and asset correlation metrics
                        </span>
                      </div>
                      <span className={`text-caption font-bold bg-band-raised px-2 py-1 rounded border ${portfolioValues && portfolioValues.length > 3 ? "text-band-gain border-band-gain/20" : "text-band-muted border-band-line/10"
                        }`}>
                        Active Strategy: {portfolioHealth}
                      </span>
                    </div>
                    <div className="bg-band-raised p-5 rounded-card ring-1 ring-inset ring-band-line/8 leading-relaxed">
                      <p className="text-xs font-bold text-band-muted mb-2 uppercase tracking-wider font-mono">
                        Macroeconomic & Structural Risk Analysis:
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
                          Sector Allocation Layout
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 pt-1">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-between text-caption font-bold text-band-muted font-mono">
                          <span>Technology & Semiconductors</span>
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
                          <span>Other Sectors ({sectorData.primarySector})</span>
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