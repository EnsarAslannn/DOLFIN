import { describe, it, expect, vi, beforeEach } from "vitest"
import axiosInstance from "../Helpers/AxiosInstance"
import { searchStocksAPI } from "./StockService"

vi.mock("../Helpers/AxiosInstance", () => ({
    default: { get: vi.fn() },
}))

const get = vi.mocked(axiosInstance.get)

const TSLA = { id: 1, symbol: "TSLA", companyName: "Tesla, Inc." }
const MSFT = { id: 2, symbol: "MSFT", companyName: "Microsoft Corporation" }

// The get mock is keyed off which filter the call carries, so each test can
// say what the symbol filter and the company-name filter each return.
const respondWith = (bySymbol: unknown[], byCompanyName: unknown[]) => {
    get.mockImplementation((_url: string, config?: { params?: Record<string, unknown> }) => {
        const params = config?.params ?? {}
        return Promise.resolve({ data: "Symbol" in params ? bySymbol : byCompanyName })
    })
}

describe("searchStocksAPI", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("asks both the symbol and the company-name filter", async () => {
        respondWith([], [])

        await searchStocksAPI("tesla")

        expect(get).toHaveBeenCalledWith("stock", { params: { Symbol: "tesla" } })
        expect(get).toHaveBeenCalledWith("stock", { params: { CompanyName: "tesla" } })
    })

    // The bug this covers: "tesla" is five characters, so a length rule read
    // it as a ticker, searched for a TESLA symbol that does not exist, and
    // showed the user nothing.
    it("finds a company whose name is as short as a ticker", async () => {
        respondWith([], [TSLA])

        expect(await searchStocksAPI("tesla")).toEqual([TSLA])
    })

    it("puts ticker matches ahead of name matches", async () => {
        respondWith([MSFT], [TSLA])

        expect(await searchStocksAPI("ms")).toEqual([MSFT, TSLA])
    })

    it("lists a stock once when both filters match it", async () => {
        respondWith([MSFT], [MSFT])

        expect(await searchStocksAPI("msft")).toEqual([MSFT])
    })

    it("trims the term before searching", async () => {
        respondWith([], [])

        await searchStocksAPI("  tesla  ")

        expect(get).toHaveBeenCalledWith("stock", { params: { Symbol: "tesla" } })
    })

    it("survives a filter that answers with something other than a list", async () => {
        respondWith([TSLA], null as unknown as unknown[])

        expect(await searchStocksAPI("tsla")).toEqual([TSLA])
    })
})
