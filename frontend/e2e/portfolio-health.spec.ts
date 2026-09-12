import { test, expect } from "@playwright/test"

const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 500 }

const json = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
})

const position = {
    id: 42,
    symbol: "TSLA",
    companyName: "Tesla Inc",
    purchase: 250,
    lastDiv: 0,
    industry: "Automotive",
    marketCap: 800000000000,
    quantity: 3,
    averagePrice: 200,
}

// The API has computed both of these since the analytics work landed and
// nothing displayed either of them -- there was no service function on this
// side at all. This is the test that says they are on screen.
const mockWallet = async (
    page: import("@playwright/test").Page,
    options: { warnings: unknown[]; rebalance: unknown },
) => {
    await page.route("**/api/account/{profile,session}", (route) => route.fulfill(json(user)))
    await page.route("**/api/alerts/notifications", (route) => route.fulfill(json([])))
    await page.route("**/api/alerts", (route) => route.fulfill(json([])))
    await page.route("**/api/stock?**", (route) => route.fulfill(json([])))
    await page.route("**/api/portfolio", (route) => route.fulfill(json([position])))
    await page.route("**/api/portfolio/transactions**", (route) => route.fulfill(json([])))
    await page.route("**/api/portfolio/metrics", (route) =>
        route.fulfill(
            json({
                totalInvestedAmount: 600,
                currentValue: 750,
                gainLossAmount: 150,
                gainLossPercent: 25,
                allocations: [],
            }),
        ),
    )
    await page.route("**/api/portfolio/warnings", (route) =>
        route.fulfill(json(options.warnings)),
    )
    await page.route("**/api/portfolio/rebalance", (route) =>
        route.fulfill(json(options.rebalance)),
    )
}

const twoHoldings = {
    adjustments: [
        {
            stockId: 42,
            symbol: "TSLA",
            currentAllocationPercent: 70,
            targetAllocationPercent: 50,
            action: "Sell",
            suggestedQuantity: 2,
        },
        {
            stockId: 43,
            symbol: "AAPL",
            currentAllocationPercent: 30,
            targetAllocationPercent: 50,
            action: "Buy",
            suggestedQuantity: 1,
        },
    ],
    holdingCount: 2,
    targetAllocationPercent: 50,
    summary: "Equal-weight target across 2 holding(s) is 50.0% each.",
}

test.describe("portfolio health", () => {
    test("the wallet shows the rebalance the API has always computed", async ({ page }) => {
        await mockWallet(page, { warnings: [], rebalance: twoHoldings })

        await page.goto("/wallet")

        const table = page.getByRole("table", { name: /yeniden dengeleme önerileri/i })
        await expect(table).toBeVisible()
        await expect(table.getByText("TSLA")).toBeVisible()
        await expect(table.getByText("AAPL")).toBeVisible()
        await expect(table.getByText(/2 sat/)).toBeVisible()
        await expect(table.getByText(/1 al/)).toBeVisible()
    })

    // The warning arrives as a code and a percentage. The sentence is written
    // on this side, which is the only reason it can be Turkish at all.
    test("a concentration warning is worded in the page's language", async ({ page }) => {
        await mockWallet(page, {
            warnings: [
                {
                    code: "portfolio.warning.concentration",
                    symbol: "TSLA",
                    industry: null,
                    percent: 70,
                    message: "TSLA is 70.0% of your portfolio. Consider diversifying.",
                },
            ],
            rebalance: twoHoldings,
        })

        await page.goto("/wallet")

        await expect(page.getByText(/TSLA portföyünüzün %70\.0/)).toBeVisible()
        await expect(page.getByText(/Consider diversifying/)).toHaveCount(0)
    })

    test("says so plainly when the allocation looks healthy", async ({ page }) => {
        await mockWallet(page, { warnings: [], rebalance: twoHoldings })

        await page.goto("/wallet")

        await expect(page.getByText(/aşırı büyüyen bir kalem yok/i)).toBeVisible()
    })
})

test.describe("price history", () => {
    // The walk had been moving prices on a timer and keeping none of it, so
    // there was never a line to draw. This is that line, on the wallet.
    test("a position row carries a sparkline of its recent prices", async ({ page }) => {
        await mockWallet(page, { warnings: [], rebalance: twoHoldings })
        await page.route("**/api/stock/history**", (route) =>
            route.fulfill(
                json([
                    {
                        stockId: 42,
                        symbol: "TSLA",
                        points: [
                            { price: 240, recordedAt: "2026-09-12T09:00:00Z" },
                            { price: 245, recordedAt: "2026-09-12T09:01:00Z" },
                            { price: 264, recordedAt: "2026-09-12T09:02:00Z" },
                        ],
                    },
                ]),
            ),
        )

        await page.goto("/wallet")

        // The label is what a reader who cannot see the line gets, so it is
        // also the honest thing to assert on.
        await expect(page.getByRole("img", { name: /TSLA son dönemde %10\.0 yükseldi/ })).toBeVisible()
    })

    test("a stock with nothing recorded says so rather than drawing a dot", async ({ page }) => {
        await mockWallet(page, { warnings: [], rebalance: twoHoldings })
        await page.route("**/api/stock/history**", (route) =>
            route.fulfill(json([{ stockId: 42, symbol: "TSLA", points: [] }])),
        )

        await page.goto("/wallet")

        await expect(page.getByText(/henüz geçmiş yok/i).first()).toBeVisible()
    })

    // One request for the whole set, not one per row.
    test("asks for every held position in a single request", async ({ page }) => {
        const requests: string[] = []

        await mockWallet(page, { warnings: [], rebalance: twoHoldings })
        await page.route("**/api/stock/history**", (route) => {
            requests.push(route.request().url())
            return route.fulfill(json([{ stockId: 42, symbol: "TSLA", points: [] }]))
        })

        await page.goto("/wallet")
        await expect(page.getByText(/henüz geçmiş yok/i).first()).toBeVisible()

        expect(requests).toHaveLength(1)
        expect(requests[0]).toContain("StockIds=42")
    })
})
