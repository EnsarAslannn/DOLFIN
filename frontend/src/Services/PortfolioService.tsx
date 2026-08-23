import axiosInstance from "../Helpers/AxiosInstance"
import type { PortfolioGet, PortfolioMetrics, Transaction } from "../Models/Portfolio"
import { handleError } from "../Helpers/ErrorHandler"

export const portfolioAddAPI = async (symbol: string, quantity: number) => {
    try {
        const data = await axiosInstance.post<{ message: string; newBalance: number }>(
            "portfolio",
            { symbol, quantity }
        )
        return data
    } catch (error) {
        handleError(error)
    }
}

export const portfolioSellAPI = async (symbol: string, quantity: number) => {
    try {
        const data = await axiosInstance.post<{ message: string; newBalance: number }>(
            "portfolio/sell",
            { symbol, quantity }
        )
        return data
    } catch (error) {
        handleError(error)
    }
}

export const portfolioGetAPI = async () => {
    try {
        const data = await axiosInstance.get<PortfolioGet[]>("portfolio")
        return data
    } catch (error) {
        handleError(error)
    }
}

export const portfolioDepositAPI = async (amount: number) => {
    try {
        const data = await axiosInstance.post<{ message: string; newBalance: number }>(
            "portfolio/deposit",
            { amount }
        )
        return data
    } catch (error) {
        handleError(error)
    }
}

export const portfolioWithdrawAPI = async (amount: number) => {
    try {
        const data = await axiosInstance.post<{ message: string; newBalance: number }>(
            "portfolio/withdraw",
            { amount }
        )
        return data
    } catch (error) {
        handleError(error)
    }
}

export const portfolioMetricsAPI = async () => {
    try {
        const data = await axiosInstance.get<PortfolioMetrics>("portfolio/metrics")
        return data
    } catch (error) {
        handleError(error)
    }
}

export const portfolioTransactionsAPI = async (pageNumber = 1, pageSize = 20) => {
    try {
        const data = await axiosInstance.get<Transaction[]>("portfolio/transactions", {
            params: { pageNumber, pageSize },
        })
        return data
    } catch (error) {
        handleError(error)
    }
}
