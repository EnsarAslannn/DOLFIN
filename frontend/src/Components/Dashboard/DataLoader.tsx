import loadingLoop from "../../assets/extra/loading-loop.mp4"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import { useLanguage } from "../../i18n/useLanguage"

interface Props {
  label?: string
  variant?: "inline" | "overlay"
}

const DataLoader = ({ label, variant = "inline" }: Props) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()

  const caption = label ?? t("loader.readingTape")

  const shell =
    variant === "overlay"
      ? "fixed inset-0 z-50 bg-onyx-canvas/92 backdrop-blur-sm"
      : "w-full py-16"

  return (
    <div
      id="loading-spinner"
      role="status"
      aria-live="polite"
      data-testid="loader"
      className={`flex flex-col items-center justify-center gap-6 ${shell}`}
    >
      {prefersReducedMotion ? (
        <span
          aria-hidden="true"
          className="h-1 w-40 animate-pulse rounded-pill bg-cobalt/60"
        />
      ) : (
        <>
        <span
          data-loader="pulse"
          aria-hidden="true"
          className="h-1 w-40 animate-pulse rounded-pill bg-cobalt/60"
        />
        <video
          data-loader="loop"
          className="h-24 w-full max-w-[320px] object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse at 50% 50%, #000 45%, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 50%, #000 45%, transparent 85%)",
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={loadingLoop} type="video/mp4" />
        </video>
        </>
      )}

      <span className="font-mono text-caption font-normal uppercase tracking-label-lg text-band-muted">
        {caption}
      </span>
    </div>
  )
}

export default DataLoader
