import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import SessionExpired from "./SessionExpired"
import { notifySessionExpired } from "../../Helpers/sessionEvents"
import { UserContext } from "../../Context/UserContext"
import type { UserProfile } from "../../Models/User"

const navigate = vi.fn()

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
    return { ...actual, useNavigate: () => navigate }
})

const logout = vi.fn()

const signedIn: UserProfile = {
    userName: "trader",
    email: "trader@test.com",
    walletBalance: 100,
}

const renderDialog = (user: UserProfile | null) =>
    render(
        <MemoryRouter>
            <UserContext.Provider
                value={{
                    user,
                    logout,
                    loginUser: vi.fn(),
                    registerUser: vi.fn(),
                    isLoggedIn: () => Boolean(user),
                    updateWalletBalance: vi.fn(),
                }}
            >
                <SessionExpired />
            </UserContext.Provider>
        </MemoryRouter>,
    )

describe("SessionExpired", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("shows nothing until a session is actually lost", () => {
        renderDialog(signedIn)

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    it("explains what happened when the session ends", async () => {
        renderDialog(signedIn)

        notifySessionExpired()

        const dialog = await screen.findByRole("dialog")
        expect(dialog).toHaveAttribute("aria-modal", "true")
        expect(screen.getByText(/oturumunuz sona erdi/i)).toBeInTheDocument()
    })

    // A visitor who never signed in has no session to have lost; the route
    // guard already sends them to sign in, with nothing to explain.
    it("stays out of the way for someone who was never signed in", async () => {
        renderDialog(null)

        notifySessionExpired()

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    })

    it("clears the stale session and routes to sign-in without reloading", async () => {
        renderDialog(signedIn)
        const user = userEvent.setup()

        notifySessionExpired()
        await user.click(await screen.findByRole("button", { name: /tekrar giriş yap/i }))

        expect(logout).toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith("/login")
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    // The dialog covers the page, so it has to be the thing the keyboard is
    // on when it appears.
    it("takes focus when it opens", async () => {
        renderDialog(signedIn)

        notifySessionExpired()

        const button = await screen.findByRole("button", { name: /tekrar giriş yap/i })
        await waitFor(() => expect(button).toHaveFocus())
    })
})
