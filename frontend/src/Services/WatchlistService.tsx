import axiosInstance from "../Helpers/AxiosInstance"
import { handleError } from "../Helpers/ErrorHandler"
import type { WatchlistItem } from "../Models/Watchlist"

export const watchlistGetAPI = async () => {
    try {
        const data = await axiosInstance.get<WatchlistItem[]>("watchlist")
        return data
    } catch (error) {
        handleError(error)
    }
}

export const watchlistAddAPI = async (stockId: number) => {
    try {
        const data = await axiosInstance.post<WatchlistItem>("watchlist", { stockId })
        return data
    } catch (error) {
        handleError(error)
    }
}

export const watchlistRemoveAPI = async (stockId: number) => {
    try {
        const data = await axiosInstance.delete(`watchlist/${stockId}`)
        return data
    } catch (error) {
        handleError(error)
    }
}
