import "@testing-library/jest-dom/vitest"

// jsdom ships no matchMedia, and every component that animates goes through
// usePrefersReducedMotion. Default to "no preference" so rendering one in a
// test exercises the same path a browser would.
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }) as MediaQueryList
}

// framer-motion's whileInView reveals need an observer to attach to. The stub
// never fires, which is the honest jsdom equivalent of "not scrolled into
// view" -- the elements still mount, so queries find them either way.
const globalWithObserver = globalThis as typeof globalThis & {
    IntersectionObserver?: typeof IntersectionObserver
}

if (!globalWithObserver.IntersectionObserver) {
    class NoopIntersectionObserver {
        readonly root = null
        readonly rootMargin = ""
        readonly scrollMargin = ""
        readonly thresholds: readonly number[] = []
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords(): IntersectionObserverEntry[] {
            return []
        }
    }

    globalWithObserver.IntersectionObserver =
        NoopIntersectionObserver as unknown as typeof IntersectionObserver
}
