import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import TransactionHistory from "./TransactionHistory"
import type { Transaction, TransactionType } from "../../../Models/Portfolio"

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: 1,
    symbol: "AAPL",
    companyName: "Apple Inc.",
    transactionType: "BUY",
    quantity: 2,
    price: 100,
    totalAmount: 200,
    timestamp: "2026-03-04T10:30:00Z",
    ...overrides,
})

const rowFor = (symbol: RegExp) => screen.getByRole("row", { name: symbol })

describe("TransactionHistory", () => {
    it("prompts the user to trade when there is no history", () => {
        render(<TransactionHistory transactions={[]} />)

        expect(screen.getByText(/nothing has happened yet/i)).toBeInTheDocument()
        expect(screen.queryByRole("table")).not.toBeInTheDocument()
    })

    // Getting this sign backwards would quietly tell the user a purchase
    // credited their wallet, so it is asserted per type rather than by shape.
    it.each<[TransactionType, string]>([
        ["BUY", "-$200.00"],
        ["WITHDRAW", "-$200.00"],
        ["SELL", "+$200.00"],
        ["DEPOSIT", "+$200.00"],
    ])("signs a %s total as %s", (transactionType, expected) => {
        render(
            <TransactionHistory
                transactions={[makeTransaction({ transactionType })]}
            />,
        )

        expect(screen.getByText(expected)).toBeInTheDocument()
    })

    it("shows the symbol, quantity and unit price for a trade", () => {
        render(<TransactionHistory transactions={[makeTransaction()]} />)

        const row = rowFor(/aapl/i)
        expect(within(row).getByText("Apple Inc.")).toBeInTheDocument()
        expect(within(row).getByText("2")).toBeInTheDocument()
        expect(within(row).getByText("$100.00")).toBeInTheDocument()
    })

    // A deposit is stored as one unit priced at the amount; printing that as
    // "1 x $500.00" would read as a share count, so both cells are dashed out.
    it("hides the synthetic quantity and price on a cash movement", () => {
        render(
            <TransactionHistory
                transactions={[
                    makeTransaction({
                        symbol: "CASH",
                        companyName: "Wallet Deposit",
                        transactionType: "DEPOSIT",
                        quantity: 1,
                        price: 500,
                        totalAmount: 500,
                    }),
                ]}
            />,
        )

        const row = rowFor(/cash/i)
        expect(within(row).getAllByText("—")).toHaveLength(2)
        expect(within(row).getByText("+$500.00")).toBeInTheDocument()
    })

    it("renders one row per transaction, in the order given", () => {
        render(
            <TransactionHistory
                transactions={[
                    makeTransaction({ id: 1, symbol: "TSLA" }),
                    makeTransaction({ id: 2, symbol: "NVDA" }),
                ]}
            />,
        )

        const symbols = screen
            .getAllByRole("row")
            .slice(1)
            .map((row) => within(row).getByText(/^(TSLA|NVDA)$/).textContent)
        expect(symbols).toEqual(["TSLA", "NVDA"])
    })

    it("falls back to a dash rather than printing Invalid Date", () => {
        render(
            <TransactionHistory
                transactions={[makeTransaction({ timestamp: "not-a-date" })]}
            />,
        )

        expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
        expect(within(rowFor(/aapl/i)).getByText("—")).toBeInTheDocument()
    })
})
