import { test, expect } from "@playwright/test"

test.describe("authentication flow", () => {
    test("redirects an unauthenticated visitor from a protected page to login", async ({ page }) => {
        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 401, body: "" }),
        )

        await page.goto("/wallet")

        await expect(page).toHaveURL(/\/login$/)
    })

    test("lets a visitor browse the catalog and the discussion without an account", async ({ page }) => {
        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 401, body: "" }),
        )
        await page.route("**/api/stock/trends", (route) =>
            route.fulfill({ status: 404, body: "" }),
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
        await page.route("**/api/comment?**", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    { id: 1, title: "Bullish", content: "Great stock!", createdBy: "someone_else", stockId: 42 },
                ]),
            }),
        )

        await page.goto("/search")

        await expect(page).toHaveURL(/\/search$/)

        await page.getByPlaceholder(/search companies/i).fill("TSLA")
        await page.getByRole("button", { name: /^search$/i }).click()

        await expect(page.getByText("Tesla Inc")).toBeVisible()
        await expect(page.getByText("Great stock!")).toBeVisible()

        // Reading is open; anything that spends money is not.
        await expect(page.getByRole("link", { name: /sign in to buy tsla/i })).toBeVisible()
        await expect(page.getByRole("button", { name: /^add$/i })).toHaveCount(0)
        await expect(page.getByText(/trading needs an account/i)).toBeVisible()
        await expect(page.getByText(/join the conversation/i)).toBeVisible()
    })

    test("shows validation errors when submitting the login form empty", async ({ page }) => {
        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 401, body: "" }),
        )

        await page.goto("/login")
        await page.getByRole("button", { name: "Sign In" }).click()

        await expect(page.getByText("Username is required")).toBeVisible()
        await expect(page.getByText("Password is required")).toBeVisible()
    })

    test("logs in successfully and lands on the search page", async ({ page }) => {
        const user = { userName: "e2e_test_user", email: "e2e@test.com", walletBalance: 0 }

        await page.route("**/api/account/profile", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/account/login", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) }),
        )
        await page.route("**/api/stock/trends", (route) =>
            route.fulfill({ status: 404, body: "" }),
        )
        await page.route("**/api/portfolio", (route) =>
            route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
        )

        await page.goto("/login")
        await page.getByLabel("Username").fill("e2e_test_user")
        await page.getByLabel("Password").fill("TestPassword1234!@#")
        await page.getByRole("button", { name: "Sign In" }).click()

        await expect(page).toHaveURL(/\/search$/)
    })
})
