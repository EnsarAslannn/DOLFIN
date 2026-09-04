import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { usePrefersReducedMotion } from "./usePrefersReducedMotion"

// The router records the hash but never acts on it, and the section a link
// points at usually lives in a lazily loaded route -- so the target can still
// be a frame or two away from existing when the navigation commits. Give it a
// short window to appear rather than scrolling once and giving up.
const RETRY_WINDOW_MS = 1000

export const useHashScroll = () => {
    const { hash, key } = useLocation()
    const prefersReducedMotion = usePrefersReducedMotion()

    useEffect(() => {
        if (!hash) return

        const id = hash.slice(1)
        const deadline = performance.now() + RETRY_WINDOW_MS
        let frame = 0

        const scrollToTarget = () => {
            const target = document.getElementById(id)

            if (target) {
                target.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                })
                return
            }

            if (performance.now() < deadline) {
                frame = requestAnimationFrame(scrollToTarget)
            }
        }

        frame = requestAnimationFrame(scrollToTarget)
        return () => cancelAnimationFrame(frame)
    }, [hash, key, prefersReducedMotion])
}
