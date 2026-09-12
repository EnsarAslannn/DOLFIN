import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PriceAlerts from "./PriceAlerts"
import {
    alertCreateAPI,
    alertDeleteAPI,
    alertsGetAPI,
} from "../../../Services/AlertService"
import { getAllStocksAPI } from "../../../Services/StockService"
import type { PriceAlert } from "../../../Models/Alert"

vi.mock("../../../Services/AlertService", () => ({
    alertsGetAPI: vi.fn(),
    alertCreateAPI: vi.fn(),
    alertDeleteAPI: vi.fn(),
}))
vi.mock("../../../Services/StockService", () => ({ getAllStocksAPI: vi.fn() }))
vi.mock("react-toastify", () => ({
    toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const listAlerts = vi.mocked(alertsGetAPI)
const createAlert = vi.mocked(alertCreateAPI)
const deleteAlert = vi.mocked(alertDeleteAPI)
const listStocks = vi.mocked(getAllStocksAPI)

const makeAlert = (overrides: Partial<PriceAlert> = {}): PriceAlert => ({
    id: 1,
    stockId: 42,
    symbol: "TSLA",
    targetPrice: 250,
    condition: "GreaterThanOrEqual",
    isActive: true,
    triggeredAt: null,
    triggeredPrice: null,
    createdAt: "2026-03-04T10:30:00Z",
    ...overrides,
})

const respondWithAlerts = (alerts: PriceAlert[]) => {
    listAlerts.mockResolvedValue({ data: alerts } as Awaited<
        ReturnType<typeof alertsGetAPI>
    >)
}

const alertsTable = () => screen.getByRole("table", { name: /fiyat alarmları/i })

describe("PriceAlerts", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        respondWithAlerts([])
        listStocks.mockResolvedValue({
            data: [{ id: 42, symbol: "TSLA", companyName: "Tesla Inc" }],
        } as Awaited<ReturnType<typeof getAllStocksAPI>>)
        createAlert.mockResolvedValue({ data: makeAlert() } as Awaited<
            ReturnType<typeof alertCreateAPI>
        >)
        deleteAlert.mockResolvedValue({ status: 204 } as Awaited<
            ReturnType<typeof alertDeleteAPI>
        >)
    })

    it("invites the user to set one when nothing is on watch", async () => {
        render(<PriceAlerts />)

        expect(await screen.findByText(/zlenen bir şey yok/)).toBeInTheDocument()
    })

    it("lists a pending alert as watching", async () => {
        respondWithAlerts([makeAlert()])

        render(<PriceAlerts />)

        const row = within(await screen.findByRole("row", { name: /tsla/i }))
        expect(row.getByText("İzleniyor")).toBeInTheDocument()
        expect(row.getByText("$250.00")).toBeInTheDocument()
    })

    // A fired alert stays in the list; the status is the only thing that says
    // whether it is still waiting for the market.
    it("marks an alert that has already fired as triggered", async () => {
        respondWithAlerts([
            makeAlert({ triggeredAt: "2026-03-05T09:00:00Z" }),
        ])

        render(<PriceAlerts />)

        expect(
            within(await screen.findByRole("row", { name: /tsla/i })).getByText(
                "Tetiklendi",
            ),
        ).toBeInTheDocument()
    })

    it("renders the direction in plain words", async () => {
        respondWithAlerts([
            makeAlert({ id: 1, symbol: "TSLA", condition: "GreaterThanOrEqual" }),
            makeAlert({ id: 2, symbol: "AAPL", condition: "LessThanOrEqual" }),
        ])

        render(<PriceAlerts />)

        await screen.findByRole("row", { name: /tsla/i })
        expect(within(alertsTable()).getByText(/fiyat şu seviyeye çıkınca/i)).toBeInTheDocument()
        expect(within(alertsTable()).getByText(/fiyat şu seviyeye inince/i)).toBeInTheDocument()
    })

    it("creates an alert from the form selections", async () => {
        const user = userEvent.setup()
        render(<PriceAlerts />)

        await waitFor(() => expect(listStocks).toHaveBeenCalled())
        await user.selectOptions(screen.getByLabelText(/hisse \/ kod/i), "42")
        await user.selectOptions(
            screen.getByLabelText(/şu durumda haber ver/i),
            "LessThanOrEqual",
        )
        await user.type(screen.getByLabelText(/hedef fiyat/i), "199.5")
        await user.click(screen.getByRole("button", { name: /alarm oluştur/i }))

        expect(createAlert).toHaveBeenCalledWith(42, 199.5, "LessThanOrEqual")
    })

    // A stock has to be chosen before a target price means anything, so the
    // submit button stays out of reach until both are set.
    it("keeps the submit button disabled until a stock and a price are set", async () => {
        const user = userEvent.setup()
        render(<PriceAlerts />)

        await waitFor(() => expect(listStocks).toHaveBeenCalled())
        const submit = screen.getByRole("button", { name: /alarm oluştur/i })
        expect(submit).toBeDisabled()

        await user.selectOptions(screen.getByLabelText(/hisse \/ kod/i), "42")
        expect(submit).toBeDisabled()

        await user.type(screen.getByLabelText(/hedef fiyat/i), "199.5")
        expect(submit).toBeEnabled()
    })

    // The API rejects a non-positive target, so a zero must never reach it --
    // the field's own minimum stops it before the submit handler runs.
    it("never sends a target price of zero to the API", async () => {
        const user = userEvent.setup()
        render(<PriceAlerts />)

        await waitFor(() => expect(listStocks).toHaveBeenCalled())
        await user.selectOptions(screen.getByLabelText(/hisse \/ kod/i), "42")
        await user.type(screen.getByLabelText(/hedef fiyat/i), "0")
        await user.click(screen.getByRole("button", { name: /alarm oluştur/i }))

        expect(createAlert).not.toHaveBeenCalled()
    })

    it("removes an alert on request", async () => {
        respondWithAlerts([makeAlert({ id: 7 })])
        const user = userEvent.setup()

        render(<PriceAlerts />)

        await user.click(
            await screen.findByRole("button", { name: /tsla alarmını kaldır/i }),
        )

        expect(deleteAlert).toHaveBeenCalledWith(7)
    })
})
