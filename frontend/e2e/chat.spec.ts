import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.route("**/api/account/session", (route) =>
    route.fulfill({ status: 204, body: "" }),
  )
})

test("assistant opens, answers from the site guide, and has no runtime errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answer: "Cüzdan sayfasından bir fiyat alarmı kurabilirsiniz.",
        sources: [{ title: "Fiyat alarmları", path: "/wallet" }],
        usedAi: false,
      }),
    }),
  )

  await page.goto("/")
  await expect(page.locator(".vite-error-overlay")).toHaveCount(0)
  await page.getByRole("button", { name: "DOL-FIN yardımcısını aç" }).click()

  const dialog = page.getByRole("dialog", { name: "DOL-FIN yardımcısı" })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("textbox", { name: "Sorunuzu yazın" }).fill("Alarm nasıl kurulur?")
  await dialog.getByRole("button", { name: "Gönder" }).click()

  await expect(dialog.getByText("Cüzdan sayfasından bir fiyat alarmı kurabilirsiniz.")).toBeVisible()
  await expect(dialog.getByRole("link", { name: "Fiyat alarmları" })).toHaveAttribute(
    "href",
    "/wallet",
  )
  await page.screenshot({ path: testInfo.outputPath("chat-widget.png"), fullPage: true })
  expect(errors).toEqual([])
})

test("assistant panel stays inside a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "DOL-FIN yardımcısını aç" }).click()

  const box = await page.getByRole("dialog", { name: "DOL-FIN yardımcısı" }).boundingBox()

  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  expect(box!.y + box!.height).toBeLessThanOrEqual(844)
})
