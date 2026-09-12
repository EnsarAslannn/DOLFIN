import { useId } from "react"
import { useLanguage } from "../../i18n/useLanguage"

interface Props {
  /** Oldest first, as the API returns them. */
  prices: number[]
  /** The ticker, for the accessible label. */
  symbol: string
  className?: string
}

const WIDTH = 96
const HEIGHT = 28
// Half the stroke, so the line at the very top or bottom is not clipped by
// the viewBox.
const PADDING = 1.5

/**
 * The recent shape of one price, in about a centimetre.
 *
 * Inline SVG rather than a charting library: this is a polyline of a few dozen
 * points with no axes, no legend and no interaction, and the smallest chart
 * library in the dependency list would be larger than the whole of the wallet
 * page's own code.
 */
const Sparkline = ({ prices, symbol, className = "" }: Props) => {
  const { t } = useLanguage()
  const gradientId = useId()

  // Two points is the minimum that describes a direction. One point is a dot
  // that reads as data when it is really "we have only just started
  // recording".
  if (prices.length < 2) {
    return (
      <span
        className={`inline-block text-caption font-normal text-band-muted ${className}`}
      >
        {t("sparkline.empty")}
      </span>
    )
  }

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min

  const innerWidth = WIDTH - PADDING * 2
  const innerHeight = HEIGHT - PADDING * 2

  const points = prices.map((price, index) => {
    const x = PADDING + (index / (prices.length - 1)) * innerWidth
    // A flat run has no span to scale against, and dividing by it would put
    // every point at NaN. Drawing it down the middle is what "nothing moved"
    // looks like.
    const ratio = span === 0 ? 0.5 : (price - min) / span
    const y = PADDING + (1 - ratio) * innerHeight
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const first = prices[0]
  const last = prices[prices.length - 1]
  const rising = last >= first

  // Colour carries the same information as the line's direction, so it is
  // reinforcement rather than the only cue -- and the label below says it in
  // words for anyone who cannot see either.
  const stroke = rising ? "var(--color-band-gain)" : "var(--color-band-loss)"

  const changePercent = first === 0 ? 0 : ((last - first) / first) * 100
  const label = t(rising ? "sparkline.label.up" : "sparkline.label.down", {
    symbol: symbol.toUpperCase(),
    percent: Math.abs(changePercent).toFixed(1),
  })

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={label}
      className={`overflow-visible ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <polygon
        points={`${PADDING},${HEIGHT - PADDING} ${points.join(" ")} ${
          WIDTH - PADDING
        },${HEIGHT - PADDING}`}
        fill={`url(#${gradientId})`}
      />

      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default Sparkline
