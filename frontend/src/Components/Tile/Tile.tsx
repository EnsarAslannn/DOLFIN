import type { ReactNode } from "react"

// The icon is chosen by `variant`, not by matching the title text: the title
// is translated copy and would stop matching the moment the language changes.
export type TileVariant = "netWorth" | "health" | "sector" | "marketCap"

type Props = {
  title: string
  subTitle: string
  variant?: TileVariant
}

const VARIANTS: Record<TileVariant, { spark: string; icon: ReactNode }> = {
  netWorth: {
    spark: "M0,35 Q15,5 30,25 T60,10 T90,5 T100,2",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    ),
  },
  health: {
    spark: "M0,20 Q20,20 40,5 T80,35 T100,10",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  sector: {
    spark: "M0,30 Q25,30 50,10 T75,25 T100,5",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
  marketCap: {
    spark: "M0,15 Q30,40 60,15 T100,5",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
        />
      </>
    ),
  },
}

const Tile = ({ title, subTitle, variant: variantKey }: Props) => {
  const variant = variantKey ? VARIANTS[variantKey] : undefined

  return (
    <div className="group relative flex min-h-[115px] w-full items-center justify-between overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 p-card transition-colors duration-200 hover:ring-band-line/20">
      {variant && (
        <div className="absolute bottom-2 right-14 hidden h-8 w-20 sm:block">
          <svg
            viewBox="0 0 100 40"
            className="h-full w-full fill-none stroke-slate-border/50 stroke-2"
            aria-hidden="true"
          >
            <path d={variant.spark} />
          </svg>
        </div>
      )}

      <div className="z-10 flex flex-col space-y-2 text-left">
        <h5 className="font-mono text-caption font-normal uppercase tracking-label-lg text-band-muted">
          {title}
        </h5>
        <span className="text-heading-sm font-normal text-band-ink">
          {subTitle}
        </span>
      </div>

      {variant && (
        <div className="z-10 flex shrink-0 items-center justify-center rounded-icon ring-1 ring-inset ring-band-line/8 bg-band-surface p-3">
          <svg
            className="h-5 w-5 text-band-ink"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {variant.icon}
          </svg>
        </div>
      )}
    </div>
  )
}

export default Tile
