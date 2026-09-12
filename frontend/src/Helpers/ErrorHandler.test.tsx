import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AxiosError, type AxiosResponse } from "axios"
import { toast } from "react-toastify"
import { handleError } from "./ErrorHandler"
import { translate } from "../i18n"
import { subscribeToSessionExpiry } from "./sessionEvents"

// Copy is read from the dictionary rather than pasted in, so these assert that
// the right key was chosen and stay quiet when the wording is reworded.
const tr = (key: string, vars?: Record<string, string>) =>
    translate("tr", key as Parameters<typeof translate>[1], vars)

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

    // The app shell decides what to do about a lost session. Assigning
    // window.location.href reloaded the whole application to reach a page the
    // router already knows, taking the screen with it.
    it("raises a session-expired event rather than reloading the page", () => {
        const heard = vi.fn()
        const unsubscribe = subscribeToSessionExpiry(heard)

        handleError(axiosErrorWith(401, {}))

        expect(heard).toHaveBeenCalledTimes(1)
        expect(window.location.href).toBe("/current")
        unsubscribe()
    })

    // The sign-in and sign-up calls opt out: a 401 there is the verdict on the
    // credentials just submitted, so the page must stay put and say why.
    it("surfaces the reason instead of announcing a lost session", () => {
        const heard = vi.fn()
        const unsubscribe = subscribeToSessionExpiry(heard)

        handleError(axiosErrorWith(401, "Invalid username or password"), {
            redirectOnUnauthorized: false,
        })

        expect(toast.warning).toHaveBeenCalledWith("Invalid username or password")
        expect(heard).not.toHaveBeenCalled()
        expect(window.location.href).toBe("/current")
        unsubscribe()
    })

    it("passes through a plain string error body", () => {
        handleError(axiosErrorWith(400, "Insufficient funds."))

        expect(toast.warning).toHaveBeenCalledWith("Insufficient funds.")
    })

    it("falls back to a generic message for an unrecognised body", () => {
        handleError(axiosErrorWith(500, { unexpected: true }))

        expect(toast.warning).toHaveBeenCalledWith(tr("error.unexpected"))
    })

    // The point of the whole exercise: the API answers with a code and the
    // figures, and the reader gets a sentence in their own language rather
    // than the English one the server composed.
    it("translates a coded API error into the reader's language", () => {
        handleError(
            axiosErrorWith(400, {
                code: "portfolio.insufficientFunds",
                message: "Insufficient funds. Required: $420.00, Available: $10.00",
                args: { required: "420.00", available: "10.00" },
            }),
        )

        expect(toast.warning).toHaveBeenCalledWith(
            tr("error.portfolio.insufficientFunds", {
                required: "420.00",
                available: "10.00",
            }),
        )
    })

    it("translates a coded error that carries no arguments", () => {
        handleError(
            axiosErrorWith(400, {
                code: "portfolio.stockNotFound",
                message: "Stock not found",
            }),
        )

        expect(toast.warning).toHaveBeenCalledWith(tr("error.portfolio.stockNotFound"))
    })

    // A code the dictionary has not caught up with reads as untranslated copy
    // rather than as an empty toast or a raw key.
    it("falls back to the server's sentence for an unknown code", () => {
        handleError(
            axiosErrorWith(400, {
                code: "something.brand.new",
                message: "A newly added rule was broken.",
            }),
        )

        expect(toast.warning).toHaveBeenCalledWith("A newly added rule was broken.")
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
