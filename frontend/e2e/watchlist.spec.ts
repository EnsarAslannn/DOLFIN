import { test, expect } from "@playwright/test"

const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 5000 }

const json = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
})

const tesla = {
    id: 42,
    symbol: "TSLA",
    companyName: "Tesla Inc",
    purchase: 250,
    industry: "Automotive",
    marketCap: 800000000000,
}

test.describe("watchlist", () => {
    // Following a company was impossible without also naming a price to watch
    // for -- a price alert was the only way to keep an eye on anything.
    test("a search result can be followed and the list picks it up", async ({ page }) => {
        const followed: Array<Record<string, unknown>> = []

        await page.route("**/api/account/{profile,session}", (route) => route.fulfill(json(user)))
        await page.route("**/api/stock/trends", (route) => route.fulfill({ status: 404, body: "" }))
        await page.route("**/api/stock?**", (route) => route.fulfill(json([tesla])))
        await page.route("**/api/comment?**", (route) => route.fulfill(json([])))
        await page.route("**/api/portfolio", (route) => route.fulfill(json([])))
        await page.route("**/api/watchlist", (route) => {
            if (route.request().method() === "POST") {
                followed.push(route.request().postDataJSON())
                return route.fulfill(
                    json({
                        id: 1,
                        stockId: 42,
                        symbol: "TSLA",
                        companyName: "Tesla Inc",
                        industry: "Automotive",
                        purchase: 250,
                        createdAt: new Date().toISOString(),
                    }),
                )
            }

            return route.fulfill(
                json(
                    followed.length > 0
                        ? [
                              {
                                  id: 1,
                                  stockId: 42,
                                  symbol: "TSLA",
                                  companyName: "Tesla Inc",
                                  industry: "Automotive",
                                  purchase: 250,
                                  createdAt: new Date().toISOString(),
                              },
                          ]
                        : [],
                ),
            )
        })

        await page.goto("/search")

        await page.getByPlaceholder(/şirketleri koda veya ada göre arayın/i).fill("TSLA")
        await page.getByRole("button", { name: /^ara$/i }).click()

        const follow = page.getByRole("button", { name: /TSLA takibe al/i })
        await expect(follow).toBeVisible()
        await follow.click()

        // The label is the state, so the button now reads the other way.
        await expect(page.getByRole("button", { name: /TSLA takibini bırak/i })).toBeVisible()
        expect(followed).toEqual([{ stockId: 42 }])
    })

    // A visitor has no account to follow with, so there is nothing to offer
    // them -- and a button that only produces a 401 is worse than no button.
    test("a visitor is not offered a follow button", async ({ page }) => {
        await page.route("**/api/account/{profile,session}", (route) =>
            route.fulfill({ status: 401, body: "" }),
        )
        await page.route("**/api/stock/trends", (route) => route.fulfill({ status: 404, body: "" }))
        await page.route("**/api/stock?**", (route) => route.fulfill(json([tesla])))
        await page.route("**/api/comment?**", (route) => route.fulfill(json([])))

        await page.goto("/search")

        await page.getByPlaceholder(/şirketleri koda veya ada göre arayın/i).fill("TSLA")
        await page.getByRole("button", { name: /^ara$/i }).click()

        await expect(page.getByText("Tesla Inc")).toBeVisible()
        await expect(page.getByRole("button", { name: /takibe al/i })).toHaveCount(0)
    })
})
