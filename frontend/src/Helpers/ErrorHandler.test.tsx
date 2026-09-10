import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "react-toastify"
import { handleError } from "./ErrorHandler"

vi.mock("react-toastify", () => ({
    toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

const axiosErrorWith = (status: number, data: unknown) => {
    const error = new AxiosError("request failed")
    error.response = { status, data, statusText: "", headers: {}, config: {} } as AxiosResponse
    return error
}

describe("handleError", () => {
    const originalLocation = window.location

    beforeEach(() => {
        vi.clearAllMocks()
        Object.defineProperty(window, "location", {
            configurable: true,
            writable: true,
            value: { href: "/current" },
        })
    })

    afterEach(() => {
        Object.defineProperty(window, "location", {
            configurable: true,
            writable: true,
            value: originalLocation,
        })
    })

    it("surfaces each entry of an ASP.NET Identity error array", () => {
        handleError(
            axiosErrorWith(400, {
                errors: [
                    { description: "Passwords must have at least one digit." },
                    { description: "Passwords must have at least one symbol." },
                ],
            }),
        )

        expect(toast.warning).toHaveBeenCalledTimes(2)
        expect(toast.warning).toHaveBeenCalledWith(
            "Passwords must have at least one digit.",
        )
    })

    it("surfaces the first message of each field in a ValidationProblemDetails object", () => {
        handleError(
            axiosErrorWith(400, {
                errors: {
                    Symbol: ["Symbol is required.", "Symbol must be uppercase."],
                    Quantity: ["Quantity must be greater than zero."],
                },
            }),
        )

        expect(toast.warning).toHaveBeenCalledTimes(2)
        expect(toast.warning).toHaveBeenCalledWith("Symbol is required.")
        expect(toast.warning).toHaveBeenCalledWith(
            "Quantity must be greater than zero.",
        )
    })

    it("sends an unauthenticated user to the login page", () => {
        handleError(axiosErrorWith(401, {}))

        expect(toast.warning).toHaveBeenCalledWith("Please login")
        expect(window.location.href).toBe("/login")
    })

    // The sign-in and sign-up calls opt out: a 401 there is the verdict on the
    // credentials just submitted, so the page must stay put and say why.
    it("surfaces the reason instead of redirecting when the redirect is opted out of", () => {
        handleError(axiosErrorWith(401, "Invalid username or password"), {
            redirectOnUnauthorized: false,
        })

        expect(toast.warning).toHaveBeenCalledWith("Invalid username or password")
        expect(toast.warning).not.toHaveBeenCalledWith("Please login")
        expect(window.location.href).toBe("/current")
    })

    it("passes through a plain string error body", () => {
        handleError(axiosErrorWith(400, "Insufficient funds."))

        expect(toast.warning).toHaveBeenCalledWith("Insufficient funds.")
    })

    it("falls back to a generic message for an unrecognised body", () => {
        handleError(axiosErrorWith(500, { unexpected: true }))

        expect(toast.warning).toHaveBeenCalledWith(
            "Beklenmeyen bir hata oluştu",
        )
    })

    it("ignores errors that did not come from axios", () => {
        handleError(new Error("some render crash"))

        expect(toast.warning).not.toHaveBeenCalled()
    })

    it("does not redirect on a network error with no response", () => {
        handleError(new AxiosError("Network Error"))

        expect(toast.warning).not.toHaveBeenCalled()
        expect(window.location.href).toBe("/current")
    })
})
