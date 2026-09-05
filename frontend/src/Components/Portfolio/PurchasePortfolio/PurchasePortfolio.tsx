import React, { useState } from "react"
import { portfolioDepositAPI } from "../../../Services/PortfolioService"
import { useAuth } from "../../../Context/useAuth"
import { toast } from "react-toastify"
import { fieldClass, labelClass, ctaBaseClass, ctaDisabledClass, ctaFillClass } from "../../../Helpers/formStyles"
import { useLanguage } from "../../../i18n/useLanguage"

interface PurchasePortfolioProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (quantity: number) => void
    stockSymbol: string
    stockPrice: number
    walletBalance: number
    mode?: "BUY" | "SELL"
    maxOwnedQuantity?: number
}

const PurchasePortfolio: React.FC<PurchasePortfolioProps> = ({
    isOpen,
    onClose,
    onConfirm,
    stockSymbol,
    stockPrice,
    walletBalance,
    mode = "BUY",
    maxOwnedQuantity = 0
}) => {
    const { updateWalletBalance } = useAuth()
    const { t } = useLanguage()
    const [quantity, setQuantity] = useState<number>(1)
    const [isDepositing, setIsDepositing] = useState<boolean>(false)

    if (!isOpen) return null

    const totalValue = stockPrice * quantity
    const isInsufficientFunds = mode === "BUY" && totalValue > walletBalance
    const isInsufficientShares = mode === "SELL" && quantity > maxOwnedQuantity

    const handleConfirm = () => {
        if (quantity <= 0) return
        if (mode === "BUY" && isInsufficientFunds) return
        if (mode === "SELL" && isInsufficientShares) return

        onConfirm(quantity)
        setQuantity(1)
    }

    const handleQuickDeposit = () => {
        setIsDepositing(true)
        portfolioDepositAPI(5000)
            .then((res) => {
                if (res && res.data?.newBalance !== undefined) {
                    updateWalletBalance(res.data.newBalance)
                    toast.success(t("trade.toast.deposited"))
                }
            })
            .catch((e) => {
                console.error(e)
                toast.warning(t("trade.toast.depositFailed"))
            })
            .finally(() => {
                setIsDepositing(false)
            })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-onyx-canvas/60 px-4">
            <div className="w-full max-w-md rounded-card bg-graphite-card ring-1 ring-inset ring-mist-border/6 p-card font-sans text-ivory-text shadow-subtle animate-fadeIn">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-heading-sm font-normal text-ivory-text">
                        {mode === "BUY" ? t("trade.buy.title") : t("trade.sell.title")}{" "}
                        <span className="font-mono">{stockSymbol}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label={t("trade.close")}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-pill ring-1 ring-inset ring-mist-border/8 text-ash-text transition-colors hover:ring-mist-border/20 hover:text-ivory-text"
                    >
                        <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="mb-6 space-y-2 rounded-card bg-obsidian-button p-4 text-body">
                    <div className="flex justify-between">
                        <span className="text-ash-text">{t("trade.walletBalance")}</span>
                        <span className="font-mono text-ivory-text">
                            ${walletBalance.toFixed(2)}
                        </span>
                    </div>
                    {mode === "SELL" && (
                        <div className="flex justify-between">
                            <span className="text-ash-text">{t("trade.availableShares")}</span>
                            <span className="font-mono text-ivory-text">
                                {t("trade.units", { count: maxOwnedQuantity })}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-ash-text">{t("trade.marketPrice")}</span>
                        <span className="font-mono text-ivory-text">
                            ${stockPrice.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="purchase-quantity" className={labelClass}>
                        {t("trade.quantity")}
                    </label>
                    <input
                        id="purchase-quantity"
                        type="number"
                        min="1"
                        max={mode === "SELL" ? maxOwnedQuantity : undefined}
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(Math.max(1, parseInt(e.target.value) || 0))
                        }
                        className={`${fieldClass} font-mono`}
                    />
                </div>

                <div className="mb-6 flex items-center justify-between border-t border-mist-border/8 pt-4">
                    <span className="text-body font-normal text-ash-text">
                        {mode === "BUY" ? t("trade.totalCost") : t("trade.totalRevenue")}
                    </span>
                    <span
                        className={`font-mono text-heading-sm font-normal ${
                            isInsufficientFunds || isInsufficientShares
                                ? "text-loss"
                                : "text-ivory-text"
                        }`}
                    >
                        ${totalValue.toFixed(2)}
                    </span>
                </div>

                {isInsufficientFunds && (
                    <div className="mb-4 flex flex-col items-center justify-center space-y-2 rounded-card bg-obsidian-button p-4">
                        <p className="text-center text-body font-normal text-loss">
                            {t("trade.insufficientFunds")}
                        </p>
                        <button
                            onClick={handleQuickDeposit}
                            disabled={isDepositing}
                            className="cursor-pointer text-body font-normal text-ivory-text underline underline-offset-4 transition-opacity hover:opacity-70"
                        >
                            {isDepositing ? t("trade.depositing") : t("trade.instantDeposit")}
                        </button>
                    </div>
                )}

                {isInsufficientShares && (
                    <div className="mb-4 rounded-card bg-obsidian-button p-4">
                        <p className="text-center text-body font-normal text-loss">
                            {t("trade.insufficientShares")}
                        </p>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-pill ring-1 ring-inset ring-mist-border/8 bg-graphite-card px-6 py-cta text-body font-normal text-ivory-text transition-colors hover:ring-mist-border/20"
                    >
                        {t("trade.cancel")}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={quantity <= 0 || isInsufficientFunds || isInsufficientShares}
                        className={`flex-1 px-6 py-cta text-body ${ctaBaseClass} ${
                            quantity <= 0 || isInsufficientFunds || isInsufficientShares
                                ? ctaDisabledClass
                                : ctaFillClass
                        }`}
                    >
                        {mode === "BUY" ? t("trade.confirmBuy") : t("trade.confirmSell")}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PurchasePortfolio
