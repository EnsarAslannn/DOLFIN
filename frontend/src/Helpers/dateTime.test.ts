import { describe, it, expect } from "vitest"
import { formatRelativeTime, formatTimestamp } from "./dateTime"

const NOW = new Date("2026-03-04T12:00:00Z").getTime()
const ago = (ms: number) => new Date(NOW - ms).toISOString()

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe("formatTimestamp", () => {
    it("renders a parseable timestamp", () => {
        expect(formatTimestamp("2026-03-04T10:30:00Z")).not.toBe("—")
    })

    // An unparseable date used to reach the screen as the string "Invalid
    // Date", which reads like a value rather than a gap.
    it("falls back to a dash when the value is not a date", () => {
        expect(formatTimestamp("not-a-date")).toBe("—")
    })
})

describe("formatRelativeTime", () => {
    it.each([
        [0, "just now"],
        [30_000, "just now"],
        [5 * MINUTE, "5m ago"],
        [3 * HOUR, "3h ago"],
        [2 * DAY, "2d ago"],
    ])("renders %i ms ago as %s", (elapsed, expected) => {
        expect(formatRelativeTime(ago(elapsed), NOW)).toBe(expected)
    })

    // Past a week the gap is better described by a date than by a count.
    it("falls back to an absolute timestamp beyond a week", () => {
        const old = formatRelativeTime(ago(30 * DAY), NOW)

        expect(old).not.toMatch(/ago$/)
        expect(old).not.toBe("—")
    })

    // Server and browser clocks drift; a timestamp a few seconds in the
    // future should not render as a negative age.
    it("treats a future timestamp as just now", () => {
        expect(formatRelativeTime(ago(-5000), NOW)).toBe("just now")
    })

    it("falls back to a dash when the value is not a date", () => {
        expect(formatRelativeTime("not-a-date", NOW)).toBe("—")
    })
})
