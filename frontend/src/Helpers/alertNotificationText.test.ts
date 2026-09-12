import { describe, it, expect } from "vitest"
import { alertNotificationText } from "./alertNotificationText"
import { createTranslator } from "../i18n"
import type { AlertNotification } from "../Models/Alert"

const tr = createTranslator("tr")
const en = createTranslator("en")

const makeNotification = (
    overrides: Partial<AlertNotification> = {},
): AlertNotification => ({
    id: 1,
    priceAlertId: 1,
    message: "TSLA reached 260.00 (target 250.00).",
    symbol: "TSLA",
    condition: "GreaterThanOrEqual",
    targetPrice: 250,
    triggeredPrice: 260,
    isRead: false,
    createdAt: "2026-03-05T09:00:00Z",
    ...overrides,
})

describe("alertNotificationText", () => {
    it("says the price rose when the alert watched for a rise", () => {
        const text = alertNotificationText(makeNotification(), en)

        expect(text).toBe("TSLA rose to $260.00 (target $250.00).")
    })

    it("says the price fell when the alert watched for a fall", () => {
        const text = alertNotificationText(
            makeNotification({ condition: "LessThanOrEqual", triggeredPrice: 240 }),
            en,
        )

        expect(text).toBe("TSLA fell to $240.00 (target $250.00).")
    })

    // The whole point: the server wrote its sentence in English at trigger
    // time, and the bell has to be able to say it in Turkish.
    it("writes the sentence in the reader's language", () => {
        const text = alertNotificationText(makeNotification(), tr)

        expect(text).toContain("yükseldi")
        expect(text).toContain("TSLA")
        expect(text).not.toContain("rose")
    })

    it("reports only the target when the firing price was not recorded", () => {
        const text = alertNotificationText(
            makeNotification({ triggeredPrice: null }),
            en,
        )

        expect(text).toBe("TSLA reached its $250.00 target.")
    })

    // Rows written before the API carried the structured fields have nothing
    // to compose from, so they keep the sentence the server stored rather than
    // rendering one with holes in it.
    it("falls back to the stored message when the alert data is missing", () => {
        const text = alertNotificationText(
            makeNotification({ symbol: "", message: "Legacy sentence." }),
            tr,
        )

        expect(text).toBe("Legacy sentence.")
    })
})
