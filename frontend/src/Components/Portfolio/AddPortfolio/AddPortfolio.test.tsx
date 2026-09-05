import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import AddPortfolio from "./AddPortfolio"
import { useAuth } from "../../../Context/useAuth"
import type { UserProfile } from "../../../Models/User"

vi.mock("../../../Context/useAuth")

const signedInAs = (user: UserProfile | null) => {
    vi.mocked(useAuth).mockReturnValue({
        user,
    } as unknown as ReturnType<typeof useAuth>)
}

const member: UserProfile = {
    userName: "trader",
    email: "trader@example.com",
    walletBalance: 1000,
}

const renderButton = (onPortfolioCreate = vi.fn()) => {
    render(
        <MemoryRouter>
            <AddPortfolio onPortfolioCreate={onPortfolioCreate} symbol="TSLA" />
        </MemoryRouter>,
    )
    return onPortfolioCreate
}

describe("AddPortfolio", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("offers a signed-in user the buy button", async () => {
        signedInAs(member)
        const onPortfolioCreate = renderButton()

        await userEvent.click(screen.getByRole("button", { name: /^ekle$/i }))

        expect(onPortfolioCreate).toHaveBeenCalled()
    })

    // A visitor can read every row on the results table, so the button has to
    // say what is missing rather than fail once it is pressed.
    it("sends a visitor to sign in instead of starting a trade", () => {
        signedInAs(null)
        renderButton()

        expect(
            screen.queryByRole("button", { name: /^ekle$/i }),
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole("link", { name: /tsla almak için giriş yapın/i }),
        ).toHaveAttribute("href", "/login")
    })
})
