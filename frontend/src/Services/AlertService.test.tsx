import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import axiosInstance from "../Helpers/AxiosInstance"
import { handleError } from "../Helpers/ErrorHandler"
import {
    alertsGetAPI,
    alertCreateAPI,
    alertDeleteAPI,
    alertNotificationsGetAPI,
    alertNotificationReadAPI,
} from "./AlertService"

vi.mock("../Helpers/AxiosInstance", () => ({
    default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))
vi.mock("../Helpers/ErrorHandler", () => ({ handleError: vi.fn() }))

const get = vi.mocked(axiosInstance.get)
const post = vi.mocked(axiosInstance.post)
const del = vi.mocked(axiosInstance.delete)

describe("AlertService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        get.mockResolvedValue({ data: [] })
        post.mockResolvedValue({ data: {} })
        del.mockResolvedValue({ status: 204 })
    })

    // Paths are relative on purpose -- axiosInstance's baseURL already ends
    // in /api/, so a leading slash here would resolve away the prefix.
    describe("request shape", () => {
        it("reads alerts through GET alerts", async () => {
            await alertsGetAPI()

            expect(get).toHaveBeenCalledWith("alerts")
        })

        // The API deserialises the condition as a .NET enum name, so the
        // string has to travel through unchanged.
        it("creates an alert through POST alerts with the enum condition", async () => {
            await alertCreateAPI(42, 199.5, "LessThanOrEqual")

            expect(post).toHaveBeenCalledWith("alerts", {
                stockId: 42,
                targetPrice: 199.5,
                condition: "LessThanOrEqual",
            })
        })

        it("deletes an alert through DELETE alerts/{id}", async () => {
            await alertDeleteAPI(7)

            expect(del).toHaveBeenCalledWith("alerts/7")
        })

        it("reads notifications through GET alerts/notifications", async () => {
            await alertNotificationsGetAPI()

            expect(get).toHaveBeenCalledWith("alerts/notifications")
        })

        it("marks one read through POST alerts/notifications/{id}/read", async () => {
            await alertNotificationReadAPI(3)

            expect(post).toHaveBeenCalledWith("alerts/notifications/3/read")
        })
    })

    describe("failures", () => {
        it("routes a failed read to the shared error handler", async () => {
            const error = new AxiosError("boom")
            get.mockRejectedValueOnce(error)

            const result = await alertsGetAPI()

            expect(handleError).toHaveBeenCalledWith(error)
            expect(result).toBeUndefined()
        })

        it("routes a failed create to the shared error handler", async () => {
            const error = new AxiosError("boom")
            post.mockRejectedValueOnce(error)

            const result = await alertCreateAPI(1, 10, "GreaterThanOrEqual")

            expect(handleError).toHaveBeenCalledWith(error)
            expect(result).toBeUndefined()
        })

        it("routes a failed delete to the shared error handler", async () => {
            const error = new AxiosError("boom")
            del.mockRejectedValueOnce(error)

            const result = await alertDeleteAPI(1)

            expect(handleError).toHaveBeenCalledWith(error)
            expect(result).toBeUndefined()
        })
    })
})
