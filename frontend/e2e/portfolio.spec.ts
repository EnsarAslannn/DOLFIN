import { test, expect } from "@playwright/test"

test.describe("portfolio flow", () => {
    test("user can buy a stock and see it in portfolio", async ({ page }) => {
        const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 10000 }
        let bought = false

        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/stock/trends", (route) =>
            route.fulfill({ status: 404, body: "" }),
        )
        await page.route("**/api/stock?**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { symbol: "TSLA", companyName: "Tesla Inc", purchase: 250, industry: "Automotive", marketCap: 800000000000 },
                ]),
            }),
        )
        await page.route("**/api/portfolio", (route) => {
            if (route.request().method() === "POST") {
                bought = true
                return route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ message: "Purchased", newBalance: 9750 }),
                })
            }

            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(
                    bought
                        ? [{ id: 1, symbol: "TSLA", companyName: "Tesla Inc", purchase: 250, lastDiv: 0, industry: "Automotive", marketCap: 800000000000, quantity: 1, averagePrice: 250 }]
                        : [],
                ),
            })
        })

        await page.goto("/search")
        await page.getByPlaceholder(/search companies/i).fill("TSLA")
        await page.getByRole("button", { name: /^search$/i }).click()

        await page.getByRole("button", { name: /^add$/i }).click()
        await page.getByRole("button", { name: /confirm buy/i }).click()

        await expect(page.getByText(/1 shares/i)).toBeVisible()
        await expect(page.getByText("$9750.00")).toBeVisible()
    })

    test("user can sell a stock from portfolio", async ({ page }) => {
        const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 5000 }
        let sold = false

        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/portfolio/sell", (route) => {
            sold = true
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ message: "Sold", newBalance: 5250 }),
            })
        })
        await page.route("**/api/portfolio", (route) => {
            if (route.request().method() !== "GET") return route.continue()

            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { id: 1, symbol: "TSLA", companyName: "Tesla Inc", purchase: 250, lastDiv: 0, industry: "Automotive", marketCap: 800000000000, quantity: sold ? 1 : 2, averagePrice: 250 },
                ]),
            })
        })

        await page.route("**/api/portfolio/metrics", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    totalInvestedAmount: 460,
                    currentValue: 500,
                    gainLossAmount: 40,
                    gainLossPercent: 8.7,
                    allocations: [
                        { stockId: 1, symbol: "TSLA", companyName: "Tesla Inc", industry: "Automotive", quantity: 2, averageCostPerShare: 230, currentPrice: 250, currentValue: 500, gainLossAmount: 40, gainLossPercent: 8.7, allocationPercent: 100 },
                    ],
                }),
            }),
        )
        await page.route("**/api/portfolio/transactions**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { id: 2, symbol: "TSLA", companyName: "Tesla Inc", transactionType: "BUY", quantity: 2, price: 230, totalAmount: 460, timestamp: "2026-03-04T10:30:00Z" },
                    { id: 1, symbol: "CASH", companyName: "Wallet Deposit", transactionType: "DEPOSIT", quantity: 1, price: 5000, totalAmount: 5000, timestamp: "2026-03-03T09:00:00Z" },
                ]),
            }),
        )

        await page.goto("/wallet")

        const holdings = page.getByRole("table", { name: /assets/i })
        const tslaRow = holdings.getByRole("row", { name: /tsla/i })
        await expect(tslaRow.getByText("$500.00")).toBeVisible()
        await tslaRow.getByRole("button", { name: /^sell$/i }).click()

        await page.getByRole("button", { name: /confirm sell/i }).click()

        await expect(page.getByText(/asset converted to cash successfully/i)).toBeVisible()
        await expect(tslaRow.getByText("$250.00").last()).toBeVisible()
    })

    test("wallet reports unrealized profit and logs every movement", async ({ page }) => {
        const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 5000 }

        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/portfolio", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { id: 1, symbol: "TSLA", companyName: "Tesla Inc", purchase: 250, lastDiv: 0, industry: "Automotive", marketCap: 800000000000, quantity: 2, averagePrice: 230 },
                ]),
            }),
        )
        await page.route("**/api/portfolio/metrics", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    totalInvestedAmount: 460,
                    currentValue: 500,
                    gainLossAmount: 40,
                    gainLossPercent: 8.7,
                    allocations: [
                        { stockId: 1, symbol: "TSLA", companyName: "Tesla Inc", industry: "Automotive", quantity: 2, averageCostPerShare: 230, currentPrice: 250, currentValue: 500, gainLossAmount: 40, gainLossPercent: 8.7, allocationPercent: 100 },
                    ],
                }),
            }),
        )
        await page.route("**/api/portfolio/transactions**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { id: 2, symbol: "TSLA", companyName: "Tesla Inc", transactionType: "BUY", quantity: 2, price: 230, totalAmount: 460, timestamp: "2026-03-04T10:30:00Z" },
                    { id: 1, symbol: "CASH", companyName: "Wallet Deposit", transactionType: "DEPOSIT", quantity: 1, price: 5000, totalAmount: 5000, timestamp: "2026-03-03T09:00:00Z" },
                ]),
            }),
        )

        await page.goto("/wallet")

        await expect(page.getByText(/unrealized p\/l/i)).toBeVisible()
        await expect(page.getByText("(8.70%)")).toBeVisible()

        const holdings = page.getByRole("table", { name: /assets/i })
        await expect(holdings.getByRole("row", { name: /tsla/i }).getByText("+$40.00")).toBeVisible()

        const history = page.getByRole("table", { name: /transaction history/i })
        await expect(history.getByRole("row", { name: /tsla/i }).getByText("-$460.00")).toBeVisible()
        await expect(history.getByRole("row", { name: /cash/i }).getByText("+$5000.00")).toBeVisible()
    })

    test("user can add a comment on a stock", async ({ page }) => {
        const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 5000 }
        let posted = false

        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/stock?**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { id: 42, symbol: "TSLA", companyName: "Tesla Inc", purchase: 250, industry: "Automotive", marketCap: 800000000000 },
                ]),
            }),
        )
        await page.route("**/api/comment/*", (route) => {
            posted = true
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ title: "Bullish", content: "Great stock!" }),
            })
        })
        await page.route("**/api/comment?**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(
                    posted
                        ? [{ id: 1, title: "Bullish", content: "Great stock!", createdBy: "e2e_test_user", stockId: 42 }]
                        : [],
                ),
            }),
        )
        await page.route("**/api/stock/trends", (route) => route.fulfill({ status: 404, body: "" }))
        await page.route("**/api/portfolio", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
        )

        await page.goto("/search")

        await page.selectOption("#comment-stock", "42")
        await page.getByPlaceholder(/sum it up in a line/i).fill("Bullish")
        await page.getByPlaceholder(/what are you seeing in this name/i).fill("Great stock!")
        await page.getByRole("button", { name: /post comment/i }).click()

        await expect(page.getByText("Great stock!")).toBeVisible()
        await expect(page.getByText(/@e2e_test_user/i)).toBeVisible()
    })

    test("shows error when stock API fails", async ({ page }) => {
        const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 5000 }

        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/stock/trends", (route) =>
            route.fulfill({ status: 404, body: "" }),
        )
        await page.route("**/api/portfolio", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
        )
        await page.route("**/api/stock?**", (route) =>
            route.fulfill({ status: 500, body: "" }),
        )

        await page.goto("/search")
        await page.getByPlaceholder(/search companies/i).fill("AAPL")
        await page.getByRole("button", { name: /^search$/i }).click()

        await expect(page.getByText(/unable to connect to local api server/i)).toBeVisible()
    })
})
