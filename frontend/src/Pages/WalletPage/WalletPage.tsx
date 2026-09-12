import React, { useState, useEffect } from "react"
import { useAuth } from "../../Context/useAuth"
import { portfolioDepositAPI, portfolioGetAPI, portfolioMetricsAPI, portfolioSellAPI, portfolioTransactionsAPI, portfolioWithdrawAPI } from "../../Services/PortfolioService"
import { getProfileAPI } from "../../Services/AuthService"
import type { PortfolioGet, PortfolioMetrics, Transaction } from "../../Models/Portfolio"
import { companyLogos } from "../../Components/Table/TestData"
import { toast } from "react-toastify"
import PurchasePortfolio from "../../Components/Portfolio/PurchasePortfolio/PurchasePortfolio"
import marketTerrain from "../../assets/extra/capital-stack.webp"
import { fieldClass, ctaBaseClass, ctaDisabledClass, ctaFillClass } from "../../Helpers/formStyles"
import Band from "../../Components/Dashboard/Band"
import MarketTicker from "../../Components/MarketTicker/MarketTicker"
import GlassLogo from "../../Components/Dashboard/GlassLogo"
import EmptyState from "../../Components/Dashboard/EmptyState"
import TransactionHistory from "../../Components/Portfolio/TransactionHistory/TransactionHistory"
import PriceAlerts from "../../Components/Alerts/PriceAlerts/PriceAlerts"
import PortfolioHealth from "../../Components/Portfolio/PortfolioHealth/PortfolioHealth"
import { Link } from "react-router-dom"
import { usePollWhileVisible } from "../../Helpers/usePollWhileVisible"
import { useLanguage } from "../../i18n/useLanguage"

// Prices move on a server-side timer, so a wallet left open goes stale.
// Matching that cadence keeps the figures honest without extra chatter.
const LIVE_REFRESH_MS = 60_000

const WalletPage = () => {
    const { user, updateWalletBalance } = useAuth()
    const { t } = useLanguage()
    const [depositAmount, setDepositAmount] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [portfolioValues, setPortfolioValues] = useState<PortfolioGet[] | null>([])
    const [isSellModalOpen, setIsSellModalOpen] = useState<boolean>(false)
    const [selectedSellStock, setSelectedSellStock] = useState<{ symbol: string; price: number; maxQuantity: number } | null>(null)
    const [liveBalance, setLiveBalance] = useState<number>(0)
    const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])

    const getWalletPortfolio = () => {
        portfolioGetAPI()
            .then((res) => {
                if (res?.data) setPortfolioValues(res.data)
            })
            .catch((e) => console.error(e))
    }

    // Cost basis lives only on the server, so unrealized P/L and the history
    // are read rather than derived -- the page still renders balances without them.
    const refreshMetrics = async () => {
        const res = await portfolioMetricsAPI()
        if (res?.data) setMetrics(res.data)
    }

    const refreshTransactions = async () => {
        const res = await portfolioTransactionsAPI()
        if (res?.data) setTransactions(res.data)
    }

    const refreshPerformance = async () => {
        await Promise.all([refreshMetrics(), refreshTransactions()])
    }

    const refreshWalletBalance = async () => {
        const res = await getProfileAPI()
        if (res?.data?.walletBalance !== undefined) {
            setLiveBalance(res.data.walletBalance)
        }
    }

    useEffect(() => {
        if (!user) return

        const loadWalletData = async () => {
            getWalletPortfolio()
            await refreshWalletBalance()
            await Promise.all([refreshMetrics(), refreshTransactions()])
        }
        loadWalletData()
    }, [user])

    // Only the price-driven figures are polled: the history changes when this
    // user trades, and a trade already refreshes it. Polling pauses while the
    // sell dialog is open so the position cannot shift under an order.
    usePollWhileVisible(
        () => {
            getWalletPortfolio()
            refreshMetrics()
        },
        LIVE_REFRESH_MS,
        Boolean(user) && !isSellModalOpen,
    )

    const handleDepositSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault()
        const amount = parseFloat(depositAmount)

        if (isNaN(amount) || amount <= 0) {
            toast.warning(t("wallet.toast.invalidAmount"))
            return
        }

        setIsSubmitting(true)
        portfolioDepositAPI(amount)
            .then((res) => {
                if (res && res.data?.newBalance !== undefined) {
                    setLiveBalance(res.data.newBalance)
                    updateWalletBalance(res.data.newBalance)
                    toast.success(`$${amount.toLocaleString()} deposited successfully!`)
                    setDepositAmount("")
                    refreshWalletBalance()
                    refreshPerformance()
                }
            })
            .catch((e) => {
                console.error(e)
                toast.error(t("wallet.toast.depositFailed"))
            })
            .finally(() => {
                setIsSubmitting(false)
            })
    }

    const triggerTableSell = (item: PortfolioGet) => {
        setSelectedSellStock({
            symbol: item.symbol,
            price: item.purchase || 0,
            maxQuantity: item.quantity || 0
        })
        setIsSellModalOpen(true)
    }

    const triggerUsdSell = () => {
        if (liveBalance <= 0) {
            toast.warning(t("wallet.toast.noUsd"))
            return
        }
        setSelectedSellStock({
            symbol: "USD",
            price: 1.00,
            maxQuantity: liveBalance
        })
        setIsSellModalOpen(true)
    }

    const handleConfirmTableSell = (quantity: number) => {
        if (!selectedSellStock) return

        if (selectedSellStock.symbol === "USD") {
            portfolioWithdrawAPI(quantity)
                .then((res) => {
                    if (res && res.status >= 200 && res.status < 300) {
                        toast.success(`$${quantity.toLocaleString()} successfully withdrawn from wallet balance!`)
                        if (res.data?.newBalance !== undefined) {
                            setLiveBalance(res.data.newBalance)
                            updateWalletBalance(res.data.newBalance)
                        }
                        setIsSellModalOpen(false)
                        setSelectedSellStock(null)
                        refreshPerformance()
                    }
                })
                .catch((e) => {
                    console.error(e)
                    toast.error(t("wallet.toast.withdrawFailed"))
                })
            return
        }

        portfolioSellAPI(selectedSellStock.symbol, quantity)
            .then((res) => {
                if (res && res.status >= 200 && res.status < 300) {
                    toast.success(t("wallet.toast.converted"))
                    if (res.data?.newBalance !== undefined) {
                        setLiveBalance(res.data.newBalance)
                        updateWalletBalance(res.data.newBalance)
                    }
                    setIsSellModalOpen(false)
                    setSelectedSellStock(null)
                    getWalletPortfolio()
                    refreshWalletBalance()
                    refreshPerformance()
                }
            })
            .catch((e) => {
                console.error(e)
                toast.error(t("wallet.toast.saleFailed"))
            })
    }

    const calculateStocksValue = () => {
        if (!portfolioValues) return 0
        return portfolioValues.reduce((total, item) => {
            const livePrice = item.purchase || 0
            const quantity = item.quantity || 0
            return total + livePrice * quantity
        }, 0)
    }

    const stocksValue = calculateStocksValue()
    const estimatedTotalValue = liveBalance + stocksValue
    const allocationBySymbol = new Map(
        (metrics?.allocations ?? []).map((a) => [a.symbol.toUpperCase(), a]),
    )
    const gainLoss = metrics?.gainLossAmount ?? 0
    const gainLossPercent = metrics?.gainLossPercent ?? 0
    const signed = (value: number) => `${value < 0 ? "-" : "+"}$${Math.abs(value).toFixed(2)}`
    const toneClass = (value: number) => (value < 0 ? "text-band-loss" : "text-band-gain")

    return (
        <div className="w-full min-h-screen bg-onyx-canvas font-sans text-left">
            <div className="w-full pt-16">
                <MarketTicker />
            </div>

            <Band tone="dark" className="pb-section pt-12">
                <div className="flex flex-col gap-10">
                <div>
                    <span className="block font-mono text-caption font-normal uppercase tracking-label-lg text-band-subtle">{t("wallet.eyebrow")}</span>
                    <h1 className="mt-3 text-heading font-medium text-band-ink md:text-heading-lg">{t("wallet.title")}</h1>
                    <p className="mt-3 max-w-[60ch] text-body-lg font-normal text-band-muted">{t("wallet.lead")}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-card bg-band-surface p-7">
                        <img
                            src={marketTerrain}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                        />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-onyx-canvas/70" />
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-onyx-canvas via-onyx-canvas/80 to-transparent" />

                        <div className="relative z-10">
                            <span className="font-mono text-caption font-normal uppercase tracking-label-lg text-band-ink/75">{t("wallet.estTotal")}</span>
                            <div className="mt-3 flex items-baseline space-x-2">
                                <h2 className="font-mono text-heading-lg font-normal text-band-ink">${estimatedTotalValue.toFixed(2)}</h2>
                                <span className="font-mono text-body font-normal text-band-ink/75">USD</span>
                            </div>
                        </div>
                        <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-band-line/20 pt-6 md:grid-cols-3">
                            <div className="flex flex-col">
                                <span className="font-mono text-caption font-normal uppercase tracking-label text-band-ink/75">{t("wallet.cashBalance")}</span>
                                <span className="mt-2 font-mono text-subheading font-normal text-band-ink">${liveBalance.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono text-caption font-normal uppercase tracking-label text-band-ink/75">{t("wallet.stocksValue")}</span>
                                <span className="mt-2 font-mono text-subheading font-normal text-band-ink">${stocksValue.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-mono text-caption font-normal uppercase tracking-label text-band-ink/75">{t("wallet.unrealized")}</span>
                                {metrics ? (
                                    <span className={`mt-2 font-mono text-subheading font-normal ${toneClass(gainLoss)}`}>
                                        {signed(gainLoss)}
                                        <span className="ml-2 text-caption">({gainLossPercent.toFixed(2)}%)</span>
                                    </span>
                                ) : (
                                    <span className="mt-2 font-mono text-subheading font-normal text-band-ink/75">—</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 p-card">
                        <div>
                            <h3 className="mb-2 text-subheading font-normal text-band-ink">{t("wallet.deposit.title")}</h3>
                            <p className="mb-4 text-body font-normal text-band-muted">{t("wallet.deposit.lead")}</p>
                        </div>
                        <form onSubmit={handleDepositSubmit} className="flex flex-col space-y-4 w-full">
                            <div>
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 font-mono text-body font-normal text-band-muted">$</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        placeholder="0.00"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className={`${fieldClass} pl-8 pr-16 font-mono`}
                                    />
                                    <span className="absolute right-4 rounded-smallcard bg-band-raised px-2 py-1 font-mono text-caption font-normal text-band-muted">USD</span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !depositAmount}
                                className={`w-full py-cta text-body ${ctaBaseClass} ${isSubmitting || !depositAmount
                                    ? ctaDisabledClass
                                    : ctaFillClass
                                    }`}
                            >
                                {isSubmitting ? t("wallet.deposit.processing") : t("wallet.deposit.submit")}
                            </button>
                        </form>
                    </div>
                </div>
                </div>
            </Band>

            <Band tone="cream" className="py-section">
                <div className="bg-band-surface ring-1 ring-inset ring-band-line/6 rounded-card overflow-hidden">
                    <div className="px-6 pb-2 pt-6">
                        <span className="block font-mono text-caption font-normal uppercase tracking-label-lg text-band-subtle">{t("wallet.holdings.eyebrow")}</span>
                        <h3 className="mt-2 text-subheading font-medium text-band-ink">{t("wallet.holdings.title")}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table aria-label={t("wallet.table.label")} className="w-full text-left border-collapse font-sans">
                            <thead>
                                <tr className="border-b border-band-line/8 font-mono text-caption font-bold uppercase tracking-label-lg text-band-muted">
                                    <th className="py-4 px-6">{t("wallet.col.asset")}</th>
                                    <th className="py-4 px-6 text-right">{t("wallet.col.marketPrice")}</th>
                                    <th className="py-4 px-6 text-right">{t("wallet.col.gainLoss")}</th>
                                    <th className="py-4 px-6 text-right">{t("wallet.col.allocation")}</th>
                                    <th className="py-4 px-6 text-center w-24">{t("wallet.col.action")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-band-line/8 text-body font-normal">
                                <tr className="hover:bg-band-raised transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <GlassLogo className="h-10 w-10" padding="p-2">
                                                {companyLogos["USD"] ? (
                                                    companyLogos["USD"]()
                                                ) : (
                                                    <span className="font-mono text-caption font-bold text-band-ink">
                                                        USD
                                                    </span>
                                                )}
                                            </GlassLogo>
                                            <div className="flex flex-col">
                                                <span className="text-body font-normal text-band-ink">{t("wallet.usd.name")}</span>
                                                <span className="font-mono text-caption font-normal tracking-wide text-band-muted">CASH</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-body font-normal text-band-muted">$1.00</td>
                                    <td className="px-6 py-4 text-right font-mono text-body font-normal text-band-muted">—</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end justify-center">
                                            <span className="font-mono text-body font-normal text-band-ink">${liveBalance.toFixed(2)}</span>
                                            <span className="mt-1 font-mono text-caption font-normal text-band-muted">
                                                {estimatedTotalValue > 0 ? ((liveBalance / estimatedTotalValue) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={triggerUsdSell}
                                            className="cursor-pointer rounded-pill ring-1 ring-inset ring-band-line/8 px-4 py-2 text-body font-normal text-band-muted transition-colors hover:ring-band-loss/50 hover:text-band-loss"
                                        >
                                            {t("wallet.sell")}
                                        </button>
                                    </td>
                                </tr>
                                {portfolioValues && portfolioValues.map((item) => {
                                    const livePrice = item.purchase || 0
                                    const symbolUpper = item.symbol.toUpperCase()
                                    const quantity = item.quantity || 0
                                    const currentStockValue = livePrice * quantity
                                    const allocation = allocationBySymbol.get(symbolUpper)

                                    return (
                                        <tr key={item.id} className="hover:bg-band-raised transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center space-x-4">
                                                    <GlassLogo className="h-10 w-10" padding="p-2">
                                                        {companyLogos[symbolUpper] ? (
                                                            companyLogos[symbolUpper]()
                                                        ) : (
                                                            <span className="font-mono text-caption font-bold text-band-ink">
                                                                {symbolUpper.slice(0, 4)}
                                                            </span>
                                                        )}
                                                    </GlassLogo>
                                                    <div className="flex flex-col">
                                                        <span className="text-body font-normal text-band-ink">{item.companyName}</span>
                                                        <span className="font-mono text-caption font-normal tracking-wide text-band-muted">{symbolUpper}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-body font-normal text-band-muted">${livePrice.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right">
                                                {allocation ? (
                                                    <div className="flex flex-col items-end justify-center">
                                                        <span className={`font-mono text-body font-normal ${toneClass(allocation.gainLossAmount)}`}>
                                                            {signed(allocation.gainLossAmount)}
                                                        </span>
                                                        <span className={`mt-1 font-mono text-caption font-normal ${toneClass(allocation.gainLossAmount)}`}>
                                                            {allocation.gainLossPercent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-body font-normal text-band-muted">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end justify-center">
                                                    <span className="font-mono text-body font-normal text-band-ink">${currentStockValue.toFixed(2)}</span>
                                                    <span className="mt-1 font-mono text-caption font-normal text-band-muted">
                                                        {estimatedTotalValue > 0 ? ((currentStockValue / estimatedTotalValue) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => triggerTableSell(item)}
                                                    className="cursor-pointer rounded-pill ring-1 ring-inset ring-band-line/8 px-4 py-2 text-body font-normal text-band-muted transition-colors hover:ring-band-loss/50 hover:text-band-loss"
                                                >
                                                    {t("wallet.sell")}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>

                {(!portfolioValues || portfolioValues.length === 0) && (
                    <EmptyState
                        variant="wallet"
                        title={t("wallet.empty.title")}
                        description={t("wallet.empty.description")}
                    >
                        <Link
                            to="/search"
                            className={`inline-flex items-center px-6 py-3 text-body ${ctaBaseClass} ${ctaFillClass}`}
                        >
                            {t("wallet.empty.cta")}
                        </Link>
                    </EmptyState>
                )}
            </Band>

            {/* The health read belongs directly under the positions it is
                about. The bands alternate dark/cream down the page, so
                inserting one shifts the two below it rather than leaving two
                of the same tone touching, which renders as a single block
                with doubled padding and no seam. */}
            <Band tone="dark" className="py-section">
                <PortfolioHealth />
            </Band>

            <Band tone="cream" className="py-section">
                <PriceAlerts />
            </Band>

            <Band tone="dark" className="py-section">
                <TransactionHistory transactions={transactions} />
            </Band>

            {selectedSellStock && (
                <PurchasePortfolio
                    isOpen={isSellModalOpen}
                    onClose={() => {
                        setIsSellModalOpen(false)
                        setSelectedSellStock(null)
                    }}
                    onConfirm={handleConfirmTableSell}
                    stockSymbol={selectedSellStock.symbol}
                    stockPrice={selectedSellStock.price}
                    walletBalance={liveBalance}
                    mode="SELL"
                    maxOwnedQuantity={selectedSellStock?.maxQuantity || 0}
                />
            )}
        </div>
    )
}

export default WalletPage