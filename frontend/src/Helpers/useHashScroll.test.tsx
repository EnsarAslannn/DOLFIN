import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { useHashScroll } from "./useHashScroll"

const Probe = () => {
    useHashScroll()
    return null
}

const renderAt = (entry: string) =>
    render(
        <MemoryRouter initialEntries={[entry]}>
            <Probe />
        </MemoryRouter>,
    )

describe("useHashScroll", () => {
    let scrollIntoView: ReturnType<typeof vi.fn<typeof Element.prototype.scrollIntoView>>

    beforeEach(() => {
        scrollIntoView = vi.fn<typeof Element.prototype.scrollIntoView>()
        Element.prototype.scrollIntoView = scrollIntoView
    })

    afterEach(() => {
        document.body.innerHTML = ""
    })

    it("scrolls to the section a hash names", async () => {
        const section = document.createElement("section")
        section.id = "how-it-works"
        document.body.appendChild(section)

        renderAt("/#how-it-works")

        await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
    })

    // The section usually belongs to a lazily loaded route, so the first frame
    // after the navigation commits can still be missing it.
    it("waits for a section that mounts a beat later", async () => {
        renderAt("/#help")

        const section = document.createElement("section")
        section.id = "help"
        document.body.appendChild(section)

        await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
    })

    it("stays put when the location carries no hash", async () => {
        renderAt("/search")

        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(scrollIntoView).not.toHaveBeenCalled()
    })
})
