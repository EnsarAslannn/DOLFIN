import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import axiosInstance from "../Helpers/AxiosInstance"
import { handleError } from "../Helpers/ErrorHandler"
import {
    portfolioAddAPI,
    portfolioSellAPI,
    portfolioGetAPI,
    portfolioDepositAPI,
    portfolioWithdrawAPI,
    portfolioMetricsAPI,
    portfolioTransactionsAPI,
} from "./PortfolioService"

vi.mock("../Helpers/AxiosInstance", () => ({
    default: { get: vi.fn(), post: vi.fn() },
}))
vi.mock("../Helpers/ErrorHandler", () => ({ handleError: vi.fn() }))

const post = vi.mocked(axiosInstance.post)
const get = vi.mocked(axiosInstance.get)

describe("PortfolioService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        post.mockResolvedValue({ data: { message: "ok", newBalance: 100 } })
        get.mockResolvedValue({ data: [] })
    })

    // Paths are relative on purpose -- axiosInstance's baseURL already ends
    // in /api/, so a leading slash here would resolve away the prefix.
    describe("request shape", () => {
        it("buys through POST portfolio with the symbol and quantity", async () => {
            await portfolioAddAPI("AAPL", 3)

            expect(post).toHaveBeenCalledWith("portfolio", {
                symbol: "AAPL",
                quantity: 3,
            })
        })

        it("sells through POST portfolio/sell", async () => {
            await portfolioSellAPI("TSLA", 2)

            expect(post).toHaveBeenCalledWith("portfolio/sell", {
                symbol: "TSLA",
                quantity: 2,
            })
        })

        it("reads positions through GET portfolio", async () => {
            await portfolioGetAPI()

            expect(get).toHaveBeenCalledWith("portfolio")
        })

        it("deposits through POST portfolio/deposit with an amount", async () => {
            await portfolioDepositAPI(250)

            expect(post).toHaveBeenCalledWith("portfolio/deposit", { amount: 250 })
        })

        it("withdraws through POST portfolio/withdraw with an amount", async () => {
            await portfolioWithdrawAPI(75)

            expect(post).toHaveBeenCalledWith("portfolio/withdraw", { amount: 75 })
        })

        it("reads performance through GET portfolio/metrics", async () => {
            await portfolioMetricsAPI()

            expect(get).toHaveBeenCalledWith("portfolio/metrics")
        })

        // Paging goes through axios params rather than a hand-built query
        // string, so the server's validator sees pageNumber/pageSize by name.
        it("reads history through GET portfolio/transactions with default paging", async () => {
            await portfolioTransactionsAPI()

            expect(get).toHaveBeenCalledWith("portfolio/transactions", {
                params: { pageNumber: 1, pageSize: 20 },
            })
        })

        it("passes an explicit page through to portfolio/transactions", async () => {
            await portfolioTransactionsAPI(3, 5)

            expect(get).toHaveBeenCalledWith("portfolio/transactions", {
                params: { pageNumber: 3, pageSize: 5 },
            })
        })

        it.each([
            ["portfolioAddAPI", () => portfolioAddAPI("AAPL", 1)],
            ["portfolioSellAPI", () => portfolioSellAPI("AAPL", 1)],
            ["portfolioDepositAPI", () => portfolioDepositAPI(1)],
            ["portfolioWithdrawAPI", () => portfolioWithdrawAPI(1)],
            ["portfolioGetAPI", () => portfolioGetAPI()],
            ["portfolioMetricsAPI", () => portfolioMetricsAPI()],
            ["portfolioTransactionsAPI", () => portfolioTransactionsAPI()],
        ])("never sends a leading slash from %s", async (_name, call) => {
            await call()

            const path = (post.mock.calls[0] ?? get.mock.calls[0])[0]
            expect(path).not.toMatch(/^\//)
        })
    })

    describe("responses", () => {
        it("returns the full axios response so callers can read the new balance", async () => {
            post.mockResolvedValue({ data: { message: "bought", newBalance: 940 } })

            const result = await portfolioAddAPI("AAPL", 1)

            expect(result?.data.newBalance).toBe(940)
        })
    })

    // Every writer swallows the rejection and reports through handleError, so
    // a failed trade resolves to undefined rather than throwing at the call
    // site. Components must therefore null-check instead of using try/catch.
    describe("failure handling", () => {
        const failures: [string, () => Promise<unknown>][] = [
            ["portfolioAddAPI", () => portfolioAddAPI("AAPL", 1)],
            ["portfolioSellAPI", () => portfolioSellAPI("AAPL", 1)],
            ["portfolioGetAPI", () => portfolioGetAPI()],
            ["portfolioDepositAPI", () => portfolioDepositAPI(1)],
            ["portfolioWithdrawAPI", () => portfolioWithdrawAPI(1)],
            ["portfolioMetricsAPI", () => portfolioMetricsAPI()],
            ["portfolioTransactionsAPI", () => portfolioTransactionsAPI()],
        ]

        it.each(failures)("%s resolves to undefined instead of rejecting", async (_name, call) => {
            const error = new AxiosError("Insufficient funds")
            post.mockRejectedValue(error)
            get.mockRejectedValue(error)

            await expect(call()).resolves.toBeUndefined()
        })

        it.each(failures)("%s routes the error through handleError", async (_name, call) => {
            const error = new AxiosError("Insufficient funds")
            post.mockRejectedValue(error)
            get.mockRejectedValue(error)

            await call()

            expect(handleError).toHaveBeenCalledWith(error)
        })
    })
})
