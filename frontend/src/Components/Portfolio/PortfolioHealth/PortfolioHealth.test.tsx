import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import PortfolioHealth from "./PortfolioHealth"
import {
    portfolioRebalanceAPI,
    portfolioWarningsAPI,
} from "../../../Services/PortfolioService"
import type {
    AllocationWarning,
    RebalancingRecommendation,
} from "../../../Models/Portfolio"

vi.mock("../../../Services/PortfolioService", () => ({
    portfolioWarningsAPI: vi.fn(),
    portfolioRebalanceAPI: vi.fn(),
}))

const listWarnings = vi.mocked(portfolioWarningsAPI)
const getRebalance = vi.mocked(portfolioRebalanceAPI)

const recommendation = (
    overrides: Partial<RebalancingRecommendation> = {},
): RebalancingRecommendation => ({
    adjustments: [
        {
            stockId: 1,
            symbol: "TSLA",
            currentAllocationPercent: 70,
            targetAllocationPercent: 50,
            action: "Sell",
            suggestedQuantity: 3,
        },
        {
            stockId: 2,
            symbol: "AAPL",
            currentAllocationPercent: 30,
            targetAllocationPercent: 50,
            action: "Buy",
            suggestedQuantity: 4,
        },
    ],
    holdingCount: 2,
    targetAllocationPercent: 50,
    summary: "Equal-weight target across 2 holding(s) is 50.0% each.",
    ...overrides,
})

const respondWith = (
    warnings: AllocationWarning[],
    rebalance: RebalancingRecommendation,
) => {
    listWarnings.mockResolvedValue({
        data: warnings,
    } as Awaited<ReturnType<typeof portfolioWarningsAPI>>)
    getRebalance.mockResolvedValue({
        data: rebalance,
    } as Awaited<ReturnType<typeof portfolioRebalanceAPI>>)
}

describe("PortfolioHealth", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        respondWith([], recommendation())
    })

    // Both endpoints existed and were tested on the API; nothing on this side
    // had ever called them.
    it("reads both the warnings and the rebalance endpoint", async () => {
        render(<PortfolioHealth />)

        await waitFor(() => expect(listWarnings).toHaveBeenCalled())
        expect(getRebalance).toHaveBeenCalled()
    })

    it("lists every suggested adjustment", async () => {
        render(<PortfolioHealth />)

        expect(await screen.findByText("TSLA")).toBeInTheDocument()
        expect(screen.getByText("AAPL")).toBeInTheDocument()
        expect(screen.getByText("70.0%")).toBeInTheDocument()
    })

    it("says what the equal-weight target works out to", async () => {
        render(<PortfolioHealth />)

        expect(await screen.findByText(/%50/)).toBeInTheDocument()
    })

    // The API sends a code and a percentage, not a sentence, so the wording
    // has to be built here -- in Turkish, which is the default.
    it("writes a concentration warning in the reader's language", async () => {
        respondWith(
            [
                {
                    code: "portfolio.warning.concentration",
                    symbol: "TSLA",
                    industry: null,
                    percent: 70,
                    message: "TSLA is 70.0% of your portfolio. Consider diversifying.",
                },
            ],
            recommendation(),
        )

        render(<PortfolioHealth />)

        const warning = await screen.findByText(/TSLA portföyünüzün/)
        expect(warning).toBeInTheDocument()
        expect(warning.textContent).toContain("%70.0")
        expect(screen.queryByText(/Consider diversifying/)).not.toBeInTheDocument()
    })

    it("writes a sector warning from the industry rather than a symbol", async () => {
        respondWith(
            [
                {
                    code: "portfolio.warning.sector",
                    symbol: null,
                    industry: "Semiconductors",
                    percent: 82.5,
                    message: "Semiconductors makes up 82.5% of your portfolio.",
                },
            ],
            recommendation(),
        )

        render(<PortfolioHealth />)

        expect(await screen.findByText(/Semiconductors portföyünüzün/)).toBeInTheDocument()
    })

    // A warning code added to the API before the dictionary catches up still
    // reads as a sentence.
    it("falls back to the server's sentence for an unknown warning code", async () => {
        respondWith(
            [
                {
                    code: "portfolio.warning.somethingNew",
                    symbol: null,
                    industry: null,
                    percent: 12,
                    message: "A newly added warning.",
                },
            ],
            recommendation(),
        )

        render(<PortfolioHealth />)

        expect(await screen.findByText("A newly added warning.")).toBeInTheDocument()
    })

    it("says so plainly when nothing is over-concentrated", async () => {
        render(<PortfolioHealth />)

        expect(
            await screen.findByText(/aşırı büyüyen bir kalem yok/i),
        ).toBeInTheDocument()
    })

    it("shows the empty state when there is nothing to weigh", async () => {
        respondWith([], recommendation({ adjustments: [], holdingCount: 0, targetAllocationPercent: 0 }))

        render(<PortfolioHealth />)

        expect(
            await screen.findByText(/henüz tartılacak bir şey yok/i),
        ).toBeInTheDocument()
    })
})
