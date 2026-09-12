import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Sparkline from "./Sparkline"

const pointsOf = (label: RegExp) =>
    screen
        .getByRole("img", { name: label })
        .querySelector("polyline")!
        .getAttribute("points")!
        .split(" ")
        .map((pair) => pair.split(",").map(Number))

describe("Sparkline", () => {
    it("draws one point per price", () => {
        render(<Sparkline prices={[10, 12, 11, 14]} symbol="TSLA" />)

        expect(pointsOf(/TSLA/)).toHaveLength(4)
    })

    it("spans the full width from first price to last", () => {
        render(<Sparkline prices={[10, 12, 11, 14]} symbol="TSLA" />)

        const points = pointsOf(/TSLA/)
        expect(points[0][0]).toBeLessThan(points[points.length - 1][0])
    })

    // SVG y grows downward, so the highest price has to sit at the smallest y.
    // Getting this backwards draws a chart that is upside down and still looks
    // plausible, which is why it is worth a test rather than an eyeball.
    it("puts the highest price above the lowest", () => {
        render(<Sparkline prices={[10, 20]} symbol="TSLA" />)

        const [[, firstY], [, secondY]] = pointsOf(/TSLA/)
        expect(secondY).toBeLessThan(firstY)
    })

    // Every point is the same, so there is no span to scale against. Dividing
    // by it would put the whole line at NaN and render nothing at all.
    it("draws a flat run down the middle rather than dividing by zero", () => {
        render(<Sparkline prices={[50, 50, 50]} symbol="TSLA" />)

        const ys = pointsOf(/TSLA/).map(([, y]) => y)
        expect(ys.every((y) => Number.isFinite(y))).toBe(true)
        expect(new Set(ys).size).toBe(1)
    })

    it("says which way the price went, for a reader who cannot see the line", () => {
        render(<Sparkline prices={[100, 110]} symbol="TSLA" />)

        expect(screen.getByRole("img", { name: /TSLA son dönemde %10\.0 yükseldi/ })).toBeInTheDocument()
    })

    it("reports a fall as a fall", () => {
        render(<Sparkline prices={[100, 90]} symbol="TSLA" />)

        expect(screen.getByRole("img", { name: /TSLA son dönemde %10\.0 düştü/ })).toBeInTheDocument()
    })

    // One price is a dot that reads as data when it really means "we have only
    // just started recording".
    it("says there is no history rather than drawing a single dot", () => {
        render(<Sparkline prices={[100]} symbol="TSLA" />)

        expect(screen.queryByRole("img")).not.toBeInTheDocument()
        expect(screen.getByText(/henüz geçmiş yok/i)).toBeInTheDocument()
    })

    it("says the same for a stock with nothing recorded at all", () => {
        render(<Sparkline prices={[]} symbol="TSLA" />)

        expect(screen.getByText(/henüz geçmiş yok/i)).toBeInTheDocument()
    })
})
