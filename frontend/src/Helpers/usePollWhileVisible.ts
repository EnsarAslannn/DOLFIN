import { useEffect, useRef } from "react"

/**
 * Calls `onTick` every `intervalMs` while the tab is visible, and once more
 * the moment a hidden tab is brought back. A background tab polling a figure
 * nobody is looking at is pure request volume, and a user returning to a stale
 * number is exactly when the staleness shows.
 */
export const usePollWhileVisible = (
  onTick: () => void,
  intervalMs: number,
  enabled = true,
) => {
  const latestTick = useRef(onTick)

  // Kept in a ref so a caller passing a fresh closure every render does not
  // restart the timer -- otherwise the interval would never actually elapse.
  useEffect(() => {
    latestTick.current = onTick
  })

  useEffect(() => {
    if (!enabled) return

    const tickIfVisible = () => {
      if (document.visibilityState === "hidden") return
      latestTick.current()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") latestTick.current()
    }

    const timer = window.setInterval(tickIfVisible, intervalMs)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [intervalMs, enabled])
}
