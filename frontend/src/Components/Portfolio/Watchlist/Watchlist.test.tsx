import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import Watchlist from "./Watchlist"
import { watchlistGetAPI, watchlistRemoveAPI } from "../../../Services/WatchlistService"
import { notifyWatchlistChanged } from "../../../Helpers/watchlistEvents"
import type { WatchlistItem } from "../../../Models/Watchlist"

vi.mock("../../../Services/WatchlistService", () => ({
    watchlistGetAPI: vi.fn(),
    watchlistRemoveAPI: vi.fn(),
}))

vi.mock("react-toastify", () => ({
    toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const listWatchlist = vi.mocked(watchlistGetAPI)
const removeFromWatchlist = vi.mocked(watchlistRemoveAPI)

const makeItem = (overrides: Partial<WatchlistItem> = {}): WatchlistItem => ({
    id: 1,
    stockId: 42,
    symbol: "TSLA",
    companyName: "Tesla, Inc.",
    industry: "Auto Manufacturers",
    purchase: 250.5,
    createdAt: "2026-09-10T10:00:00Z",
    ...overrides,
})

const respondWith = (items: WatchlistItem[]) => {
    listWatchlist.mockResolvedValue({
        data: items,
    } as Awaited<ReturnType<typeof watchlistGetAPI>>)
}

const renderWatchlist = () =>
    render(
        <MemoryRouter>
            <Watchlist />
        </MemoryRouter>,
    )

describe("Watchlist", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        respondWith([])
        removeFromWatchlist.mockResolvedValue(undefined)
    })

    it("lists a followed company with its ticker and price", async () => {
        respondWith([makeItem()])

        renderWatchlist()

        expect(await screen.findByText("Tesla, Inc.")).toBeInTheDocument()
        expect(screen.getByText("TSLA")).toBeInTheDocument()
        expect(screen.getByText("$250.50")).toBeInTheDocument()
    })

    it("points an empty list at the search page", async () => {
        renderWatchlist()

        expect(await screen.findByText(/listede bir şey yok/i)).toBeInTheDocument()
        expect(screen.getByRole("link", { name: /şirket bul/i })).toHaveAttribute(
            "href",
            "/search",
        )
    })

    it("unfollows the stock that was clicked", async () => {
        respondWith([makeItem({ stockId: 42 }), makeItem({ id: 2, stockId: 43, symbol: "AAPL" })])

        renderWatchlist()
        const user = userEvent.setup()

        await user.click(await screen.findByRole("button", { name: /TSLA takibini bırak/i }))

        expect(removeFromWatchlist).toHaveBeenCalledWith(42)
        expect(removeFromWatchlist).not.toHaveBeenCalledWith(43)
    })

    // The row has to go when it is clicked rather than after the round trip,
    // or the list looks stuck while the request is in flight.
    it("drops the row before the server answers", async () => {
        respondWith([makeItem()])
        removeFromWatchlist.mockReturnValue(new Promise(() => {}))

        renderWatchlist()
        const user = userEvent.setup()

        await user.click(await screen.findByRole("button", { name: /TSLA takibini bırak/i }))

        await waitFor(() => expect(screen.queryByText("Tesla, Inc.")).not.toBeInTheDocument())
    })

    // Following happens on the search page, which cannot reach this
    // component's state.
    it("re-reads the list when a follow changes elsewhere", async () => {
        renderWatchlist()
        await waitFor(() => expect(listWatchlist).toHaveBeenCalledTimes(1))

        notifyWatchlistChanged()

        await waitFor(() => expect(listWatchlist).toHaveBeenCalledTimes(2))
    })
})
