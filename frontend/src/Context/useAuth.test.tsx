import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AxiosResponse } from "axios"
import { MemoryRouter } from "react-router"
import { UserProvider } from "./AuthContext"
import { useAuth } from "./useAuth"
import * as AuthService from "../Services/AuthService"
import type { UserProfile } from "../Models/User"

vi.mock("../Services/AuthService")
vi.mock("react-toastify", () => ({
    toast: { success: vi.fn(), warning: vi.fn() },
}))

function TestConsumer() {
    const { loginUser, logout, user, isLoggedIn } = useAuth()
    return (
        <div>
            <button onClick={() => loginUser("bob", "pw")}>login</button>
            <button onClick={logout}>logout</button>
            <span data-testid="status">{isLoggedIn() ? "in" : "out"}</span>
            <span data-testid="username">{user?.userName ?? ""}</span>
        </div>
    )
}

const renderWithProvider = () =>
    render(
        <MemoryRouter>
            <UserProvider>
                <TestConsumer />
            </UserProvider>
        </MemoryRouter>,
    )

const asProfileResponse = (data: UserProfile) =>
    ({ data, status: 200, statusText: "OK", headers: {}, config: {} }) as AxiosResponse<UserProfile>

describe("useAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(AuthService.getSessionAPI).mockResolvedValue(null)
        vi.mocked(AuthService.getProfileAPI).mockResolvedValue(undefined)
        vi.mocked(AuthService.logoutAPI).mockResolvedValue(undefined)
    })

    it("restores the session from the server on mount when a valid cookie exists", async () => {
        vi.mocked(AuthService.getSessionAPI).mockResolvedValue({
            userName: "bob",
            email: "bob@test.com",
            walletBalance: 50,
        })

        renderWithProvider()

        await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("in"))
        expect(screen.getByTestId("username").textContent).toBe("bob")
    })

    it("stays logged out when no session cookie is present", async () => {
        renderWithProvider()

        await waitFor(() => expect(screen.getByTestId("status")).toBeInTheDocument())
        expect(screen.getByTestId("status").textContent).toBe("out")
    })

    it("populates user state after a successful login (no token handling needed)", async () => {
        vi.mocked(AuthService.loginAPI).mockResolvedValue(
            asProfileResponse({ userName: "bob", email: "bob@test.com", walletBalance: 100 }),
        )

        renderWithProvider()

        await userEvent.click(await screen.findByText("login"))

        await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("in"))
        expect(screen.getByTestId("username").textContent).toBe("bob")
    })

    it("calls the logout endpoint and clears local state on logout", async () => {
        vi.mocked(AuthService.getSessionAPI).mockResolvedValue({
            userName: "bob",
            email: "bob@test.com",
            walletBalance: 0,
        })

        renderWithProvider()

        await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("in"))

        await userEvent.click(screen.getByText("logout"))

        expect(AuthService.logoutAPI).toHaveBeenCalled()
        expect(screen.getByTestId("status").textContent).toBe("out")
    })
})
