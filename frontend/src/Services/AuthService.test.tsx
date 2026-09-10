import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError, type AxiosResponse } from "axios"
import axiosInstance from "../Helpers/AxiosInstance"
import { handleError } from "../Helpers/ErrorHandler"
import { getSessionAPI, loginAPI, registerAPI } from "./AuthService"

vi.mock("../Helpers/AxiosInstance", () => ({
    default: { get: vi.fn(), post: vi.fn() },
}))

vi.mock("../Helpers/ErrorHandler", () => ({ handleError: vi.fn() }))

const get = vi.mocked(axiosInstance.get)
const post = vi.mocked(axiosInstance.post)
const reportError = vi.mocked(handleError)

const rejectedWith = (status: number, data: unknown) => {
    const error = new AxiosError("request failed")
    error.response = { status, data, statusText: "", headers: {}, config: {} } as AxiosResponse
    return error
}

describe("getSessionAPI", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("reads the session through GET account/session", async () => {
        get.mockResolvedValue({ status: 204, data: "" })

        await getSessionAPI()

        expect(get).toHaveBeenCalledWith("account/session")
    })

    it("returns the profile when a session is live", async () => {
        const profile = { userName: "bob", email: "bob@test.com", walletBalance: 25 }
        get.mockResolvedValue({ status: 200, data: profile })

        expect(await getSessionAPI()).toEqual(profile)
    })

    // A guest gets 204 with an empty body rather than the 401 that
    // account/profile raises, so no failed request reaches the console.
    it("returns null for the 204 a guest gets back", async () => {
        get.mockResolvedValue({ status: 204, data: "" })

        expect(await getSessionAPI()).toBeNull()
    })

    it("returns null rather than throwing when the request fails", async () => {
        get.mockRejectedValue(new Error("network down"))

        expect(await getSessionAPI()).toBeNull()
    })
})

// A wrong password answers with 401 just as an expired session does. Routing
// it through the default handler would send the user to the login page they
// are already standing on -- a full app reload that also throws away the
// reason the server gave.
describe("credential rejection", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("does not treat a rejected login as an expired session", async () => {
        post.mockRejectedValue(rejectedWith(401, "Invalid username or password"))

        await loginAPI("bob", "wrong-password")

        expect(reportError).toHaveBeenCalledWith(expect.anything(), {
            redirectOnUnauthorized: false,
        })
    })

    it("does not treat a rejected registration as an expired session", async () => {
        post.mockRejectedValue(rejectedWith(401, "nope"))

        await registerAPI("bob@test.com", "bob", "Password1234!@#")

        expect(reportError).toHaveBeenCalledWith(expect.anything(), {
            redirectOnUnauthorized: false,
        })
    })
})
