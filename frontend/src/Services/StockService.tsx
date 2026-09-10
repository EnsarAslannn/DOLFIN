import axiosInstance from "../Helpers/AxiosInstance"
import type { StockSearchResult } from "../Models/StockSearchResult"

export const searchStocksBySymbolAPI = (symbol: string) => {
    return axiosInstance.get<StockSearchResult[]>("stock", { params: { Symbol: symbol } })
}

export const searchStocksByCompanyNameAPI = (companyName: string) => {
    return axiosInstance.get<StockSearchResult[]>("stock", { params: { CompanyName: companyName } })
}

export const getAllStocksAPI = () => {
    return axiosInstance.get("stock", { params: { PageSize: 100, SortBy: "Symbol" } })
}

const identify = (stock: StockSearchResult) =>
    stock.id ?? stock.Id ?? (stock.symbol ?? stock.Symbol ?? "").toUpperCase()

/**
 * Searches the catalog by ticker and by company name at once, ticker matches
 * first.
 *
 * Nobody knows in advance whether what they typed is a ticker or a name, and
 * the two are not distinguishable by length: "tesla" and "apple" are five
 * characters, so the old "short means ticker" rule sent them to the symbol
 * filter and returned nothing at all -- the catalog's tickers are TSLA and
 * AAPL. Both filters are asked instead, and the results merged.
 */
export const searchStocksAPI = async (term: string): Promise<StockSearchResult[]> => {
    const query = term.trim()

    const [bySymbol, byCompanyName] = await Promise.all([
        searchStocksBySymbolAPI(query),
        searchStocksByCompanyNameAPI(query),
    ])

    const results = Array.isArray(bySymbol.data) ? [...bySymbol.data] : []
    const seen = new Set(results.map(identify))

    if (Array.isArray(byCompanyName.data)) {
        for (const stock of byCompanyName.data) {
            const key = identify(stock)
            if (seen.has(key)) continue
            seen.add(key)
            results.push(stock)
        }
    }

    return results
}
