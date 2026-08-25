import axiosInstance from "../Helpers/AxiosInstance"
import type { AlertNotification, PriceAlert, PriceAlertCondition } from "../Models/Alert"
import { handleError } from "../Helpers/ErrorHandler"

export const alertsGetAPI = async () => {
    try {
        const data = await axiosInstance.get<PriceAlert[]>("alerts")
        return data
    } catch (error) {
        handleError(error)
    }
}

export const alertCreateAPI = async (
    stockId: number,
    targetPrice: number,
    condition: PriceAlertCondition,
) => {
    try {
        const data = await axiosInstance.post<PriceAlert>("alerts", {
            stockId,
            targetPrice,
            condition,
        })
        return data
    } catch (error) {
        handleError(error)
    }
}

export const alertDeleteAPI = async (alertId: number) => {
    try {
        const data = await axiosInstance.delete(`alerts/${alertId}`)
        return data
    } catch (error) {
        handleError(error)
    }
}

export const alertNotificationsGetAPI = async () => {
    try {
        const data = await axiosInstance.get<AlertNotification[]>("alerts/notifications")
        return data
    } catch (error) {
        handleError(error)
    }
}

export const alertNotificationReadAPI = async (notificationId: number) => {
    try {
        const data = await axiosInstance.post<AlertNotification>(
            `alerts/notifications/${notificationId}/read`,
        )
        return data
    } catch (error) {
        handleError(error)
    }
}
