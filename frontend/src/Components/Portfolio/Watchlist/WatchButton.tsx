import { useLanguage } from "../../../i18n/useLanguage"

interface Props {
  symbol: string
  isWatched: boolean
  onToggle: () => void
}

/**
 * Follow / unfollow, as one button whose state is its label.
 *
 * The label changes rather than only the colour, because "am I following
 * this?" is the entire question the control answers and colour alone answers
 * it for some readers and not others.
 */
const WatchButton = ({ symbol, isWatched, onToggle }: Props) => {
  const { t } = useLanguage()

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isWatched}
      aria-label={t(isWatched ? "watchlist.remove.aria" : "watchlist.follow.aria", {
        symbol,
      })}
      className={`cursor-pointer rounded-pill px-4 py-2 font-mono text-caption font-normal uppercase tracking-label transition-colors ring-1 ring-inset ${
        isWatched
          ? "text-cobalt ring-cobalt/40 hover:text-band-loss hover:ring-band-loss/50"
          : "text-band-muted ring-band-line/20 hover:text-band-ink hover:ring-band-line/40"
      }`}
    >
      {t(isWatched ? "watchlist.following" : "watchlist.follow")}
    </button>
  )
}

export default WatchButton
