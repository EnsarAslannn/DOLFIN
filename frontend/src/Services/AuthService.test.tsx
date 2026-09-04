import { describe, it, expect, vi, beforeEach } from "vitest"
import axiosInstance from "../Helpers/AxiosInstance"
import { getSessionAPI } from "./AuthService"

vi.mock("../Helpers/AxiosInstance", () => ({
    default: { get: vi.fn(), post: vi.fn() },
}))

const get = vi.mocked(axiosInstance.get)

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
