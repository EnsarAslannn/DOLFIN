import { test, expect } from "@playwright/test"

test("TR is the default and EN switches every page", async ({ page }) => {
    await page.route("**/api/account/{profile,session}", (route) =>
        route.fulfill({ status: 401, body: "" }),
    )

    await page.goto("/")

    // Default: Turkish.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("sinyali bulun")
    await expect(page.getByRole("link", { name: "Hesap oluştur" }).first()).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("lang", "tr")

    // Switch to English from the toggle left of the wordmark.
    const group = page.getByRole("group", { name: "Dil" })
    await expect(group).toBeVisible()
    await group.getByRole("button", { name: "EN" }).click()

    await expect(page.getByRole("heading", { level: 1 })).toContainText("beneath the noise")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")

    // The choice follows the visitor to another route.
    await page.goto("/search")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find a company")
    await expect(page.getByPlaceholder(/search companies/i)).toBeVisible()

    // And back to Turkish.
    await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "TR" }).click()
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Şirket bulun")

    // Survives a reload.
    await page.reload()
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Şirket bulun")
})
