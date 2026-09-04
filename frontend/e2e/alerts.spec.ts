import { test, expect } from "@playwright/test"

const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 5000 }

const json = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
})

test.describe("price alerts", () => {
    test("a triggered alert reaches the user through the navbar bell", async ({ page }) => {
        let read = false

        await page.route("**/api/account/{profile,session}", (route) => route.fulfill(json(user)))
        await page.route("**/api/stock/trends", (route) =>
            route.fulfill({ status: 404, body: "" }),
        )
        await page.route("**/api/stock?**", (route) => route.fulfill(json([])))
        await page.route("**/api/comment?**", (route) => route.fulfill(json([])))
        await page.route("**/api/portfolio", (route) => route.fulfill(json([])))
        await page.route("**/api/alerts/notifications/1/read", (route) => {
            read = true
            return route.fulfill(
                json({ id: 1, priceAlertId: 1, message: "read", isRead: true, createdAt: new Date().toISOString() }),
            )
        })
        await page.route("**/api/alerts/notifications", (route) =>
            route.fulfill(
                json([
                    {
                        id: 1,
                        priceAlertId: 1,
                        message: "TSLA reached 260.00 (target 250.00).",
                        isRead: read,
                        createdAt: new Date().toISOString(),
                    },
                ]),
            ),
        )

        await page.goto("/search")

        const bell = page.getByRole("button", { name: /1 unread/i })
        await expect(bell).toBeVisible()
        await bell.click()

        const panel = page.getByRole("region", { name: /price alert notifications/i })
        await expect(panel.getByText(/TSLA reached 260\.00/)).toBeVisible()

        await panel.getByText(/TSLA reached 260\.00/).click()

        await expect(page.getByRole("button", { name: /^notifications$/i })).toBeVisible()
    })

    test("a user can set a price alert from the wallet", async ({ page }) => {
        const created: Array<Record<string, unknown>> = []

        await page.route("**/api/account/{profile,session}", (route) => route.fulfill(json(user)))
        await page.route("**/api/alerts/notifications", (route) => route.fulfill(json([])))
        await page.route("**/api/portfolio", (route) => route.fulfill(json([])))
        await page.route("**/api/portfolio/metrics", (route) =>
            route.fulfill(
                json({
                    totalInvestedAmount: 0,
                    currentValue: 0,
                    gainLossAmount: 0,
                    gainLossPercent: 0,
                    allocations: [],
                }),
            ),
        )
        await page.route("**/api/portfolio/transactions**", (route) => route.fulfill(json([])))
        await page.route("**/api/stock?**", (route) =>
            route.fulfill(
                json([{ id: 42, symbol: "TSLA", companyName: "Tesla Inc", purchase: 250, industry: "Automotive", marketCap: 800000000000 }]),
            ),
        )
        await page.route("**/api/alerts", (route) => {
            if (route.request().method() === "POST") {
                created.push(route.request().postDataJSON())
                return route.fulfill(
                    json({
                        id: 1,
                        stockId: 42,
                        symbol: "TSLA",
                        targetPrice: 300,
                        condition: "GreaterThanOrEqual",
                        isActive: true,
                        triggeredAt: null,
                        createdAt: new Date().toISOString(),
                    }),
                )
            }

            return route.fulfill(json(created.length > 0
                ? [{
                    id: 1,
                    stockId: 42,
                    symbol: "TSLA",
                    targetPrice: 300,
                    condition: "GreaterThanOrEqual",
                    isActive: true,
                    triggeredAt: null,
                    createdAt: new Date().toISOString(),
                }]
                : []))
        })

        await page.goto("/wallet")

        await expect(page.getByText(/nothing on watch/i)).toBeVisible()

        await page.selectOption("#alert-stock", "42")
        await page.fill("#alert-target", "300")
        await page.getByRole("button", { name: /create alert/i }).click()

        const alerts = page.getByRole("table", { name: /price alerts/i })
        const row = alerts.getByRole("row", { name: /tsla/i })
        await expect(row.getByText("$300.00")).toBeVisible()
        await expect(row.getByText("Watching")).toBeVisible()

        expect(created).toEqual([
            { stockId: 42, targetPrice: 300, condition: "GreaterThanOrEqual" },
        ])
    })
})
