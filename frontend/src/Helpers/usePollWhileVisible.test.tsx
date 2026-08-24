import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePollWhileVisible } from "./usePollWhileVisible"

const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
    })
    document.dispatchEvent(new Event("visibilitychange"))
}

describe("usePollWhileVisible", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: () => "visible",
        })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("does not fire immediately -- the caller has already loaded once", () => {
        const onTick = vi.fn()

        renderHook(() => usePollWhileVisible(onTick, 1000))

        expect(onTick).not.toHaveBeenCalled()
    })

    it("fires once per interval while the tab is visible", () => {
        const onTick = vi.fn()
        renderHook(() => usePollWhileVisible(onTick, 1000))

        act(() => void vi.advanceTimersByTime(3000))

        expect(onTick).toHaveBeenCalledTimes(3)
    })

    it("stays quiet while the tab is hidden", () => {
        const onTick = vi.fn()
        renderHook(() => usePollWhileVisible(onTick, 1000))

        act(() => setVisibility("hidden"))
        act(() => void vi.advanceTimersByTime(5000))

        expect(onTick).not.toHaveBeenCalled()
    })

    // Returning to a tab is exactly when a stale number is most visible, so
    // the hook refreshes then rather than waiting out the rest of the interval.
    it("fires as soon as a hidden tab becomes visible again", () => {
        const onTick = vi.fn()
        renderHook(() => usePollWhileVisible(onTick, 1000))

        act(() => setVisibility("hidden"))
        act(() => setVisibility("visible"))

        expect(onTick).toHaveBeenCalledTimes(1)
    })

    it("does nothing at all when disabled", () => {
        const onTick = vi.fn()
        renderHook(() => usePollWhileVisible(onTick, 1000, false))

        act(() => void vi.advanceTimersByTime(5000))
        act(() => setVisibility("visible"))

        expect(onTick).not.toHaveBeenCalled()
    })

    it("stops polling once disabled after having run", () => {
        const onTick = vi.fn()
        const { rerender } = renderHook(
            ({ enabled }) => usePollWhileVisible(onTick, 1000, enabled),
            { initialProps: { enabled: true } },
        )

        act(() => void vi.advanceTimersByTime(1000))
        rerender({ enabled: false })
        act(() => void vi.advanceTimersByTime(5000))

        expect(onTick).toHaveBeenCalledTimes(1)
    })

    // A caller passing a fresh closure every render must not reset the timer,
    // or the interval would restart before it could ever elapse.
    it("keeps the timer running when the callback identity changes", () => {
        let calls = 0
        const { rerender } = renderHook(() =>
            usePollWhileVisible(() => {
                calls += 1
            }, 1000),
        )

        act(() => void vi.advanceTimersByTime(900))
        rerender()
        act(() => void vi.advanceTimersByTime(200))

        expect(calls).toBe(1)
    })

    it("calls the newest callback, not the one from the first render", () => {
        const first = vi.fn()
        const second = vi.fn()
        const { rerender } = renderHook(({ cb }) => usePollWhileVisible(cb, 1000), {
            initialProps: { cb: first },
        })

        rerender({ cb: second })
        act(() => void vi.advanceTimersByTime(1000))

        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledTimes(1)
    })

    it("clears its timer and listener on unmount", () => {
        const onTick = vi.fn()
        const { unmount } = renderHook(() => usePollWhileVisible(onTick, 1000))

        unmount()
        act(() => void vi.advanceTimersByTime(5000))
        act(() => setVisibility("visible"))

        expect(onTick).not.toHaveBeenCalled()
    })
})
