import { useEffect, useRef, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import { useLanguage } from "../../i18n/useLanguage"

interface Props {
  open: boolean
  onClose: () => void
  isLight: boolean
  triggerRef: React.RefObject<HTMLButtonElement | null>
  id: string
  children: ReactNode
}

const MobileMenu = ({
  open,
  onClose,
  isLight,
  triggerRef,
  id,
  children,
}: Props) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      onClose()
      triggerRef.current?.focus()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose, triggerRef])

  const duration = prefersReducedMotion ? 0 : 0.22

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-onyx-canvas/70 backdrop-blur-sm md:hidden"
          />

          <motion.div
            key="sheet"
            id={id}
            ref={panelRef}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration, ease: [0.22, 0.61, 0.36, 1] }}
            className={`fixed inset-x-0 top-16 z-50 border-b md:hidden ${
              isLight
                ? "border-onyx-canvas/10 bg-cream-canvas"
                : "border-mist-border/10 bg-onyx-canvas"
            }`}
          >
            <nav
              aria-label={t("nav.mobileLabel")}
              className="flex flex-col gap-1 px-6 pb-8 pt-4"
            >
              {children}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileMenu
