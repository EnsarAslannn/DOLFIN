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
  await page.getByRole("button", { name: "DOL-FIN asistanını aç" }).click()

  const dialog = page.getByRole("dialog", { name: "DOL-FIN asistanı" })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("textbox", { name: "Sorunuzu yazın" }).fill("Alarm nasıl kurulur?")
  await dialog.getByRole("button", { name: "Gönder" }).click()

  await expect(dialog.getByText("Cüzdan sayfasından bir fiyat alarmı kurabilirsiniz.")).toBeVisible()
  await expect(dialog.getByRole("link", { name: "Fiyat alarmları" })).toHaveAttribute(
    "href",
    "/wallet",
  )
  await page.screenshot({ path: testInfo.outputPath("chat-widget.png"), fullPage: true })

  await page.reload()
  await page.getByRole("button", { name: "DOL-FIN asistanını aç" }).click()
  const restoredDialog = page.getByRole("dialog", { name: "DOL-FIN asistanı" })
  await expect(restoredDialog.getByText("Alarm nasıl kurulur?")).toBeVisible()
  await expect(restoredDialog.getByText("Cüzdan sayfasından bir fiyat alarmı kurabilirsiniz.")).toBeVisible()

  await restoredDialog.getByRole("button", { name: "Yeni sohbet" }).click()
  await expect(restoredDialog.getByText("Alarm nasıl kurulur?")).toHaveCount(0)
  await expect(restoredDialog.getByRole("button", { name: "Nasıl portföy oluştururum?" })).toBeVisible()
  expect(errors).toEqual([])
})

test("assistant panel stays inside a mobile viewport", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "DOL-FIN asistanını aç" }).click()

  const box = await page.getByRole("dialog", { name: "DOL-FIN asistanı" }).boundingBox()

  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  expect(box!.y + box!.height).toBeLessThanOrEqual(844)
  await page.screenshot({ path: testInfo.outputPath("chat-widget-mobile.png"), fullPage: true })
})

test("signed-in user can inspect a portfolio and confirm a simulated trade", async ({
  page,
}, testInfo) => {
  await page.unroute("**/api/account/session")
  await page.route("**/api/account/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ userName: "ada", email: "ada@example.com", walletBalance: 1000 }),
    }),
  )
  await page.route("**/api/portfolio", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "ok", newBalance: 700 }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 1,
          symbol: "AAPL",
          companyName: "Apple",
          purchase: 150,
          lastDiv: 0,
          industry: "Technology",
          marketCap: 1,
          quantity: 2,
          averagePrice: 120,
        },
      ]),
    })
  })
  await page.route("**/api/stock?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 1, symbol: "AAPL", companyName: "Apple", purchase: 150 }]),
    }),
  )

  await page.goto("/")
  await page.getByRole("button", { name: "DOL-FIN asistanını aç" }).click()
  const dialog = page.getByRole("dialog", { name: "DOL-FIN asistanı" })

  await dialog.getByRole("button", { name: "Portföyümü göster" }).click()
  await expect(dialog.getByText(/AAPL: 2 adet/)).toBeVisible()
  await expect(dialog.getByText(/Sanal bakiye: \$1,000\.00/)).toBeVisible()

  await dialog.getByRole("button", { name: "Simülasyon işlemi" }).click()
  await dialog.getByRole("textbox", { name: "Hisse kodu" }).fill("AAPL")
  await dialog.getByRole("spinbutton", { name: "Adet" }).fill("2")
  await dialog.getByRole("button", { name: "İşlemi önizle" }).click()
  await expect(dialog.getByText("Tahmini toplam: $300.00")).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("chat-simulated-trade.png") })

  await dialog.getByRole("button", { name: "2 adet AAPL alımını onayla" }).click()
  await expect(dialog.getByText(/2 adet AAPL alındı/)).toBeVisible()
  await expect(page.getByText("$700.00", { exact: true })).toBeVisible()
})
