import { DEMO_TICKERS } from "../../Helpers/demoStocks"
import { useState, type ChangeEvent, type SyntheticEvent } from "react"
import { ctaCompactClass } from "../../Helpers/formStyles"
import { useLanguage } from "../../i18n/useLanguage"

interface Props {
  onSearchSubmit: (e: SyntheticEvent, overrideQuery?: string) => void
  search: string | undefined
  handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const Search: React.FC<Props> = ({
  onSearchSubmit,
  search,
  handleSearchChange,
}: Props) => {
  const { t } = useLanguage()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestions = DEMO_TICKERS

  const handleSuggestionClick = (symbol: string) => {
    const customEvent = {
      target: { value: symbol }
    } as ChangeEvent<HTMLInputElement>

    handleSearchChange(customEvent)
    setShowSuggestions(false)

    const mockFormEvent = { preventDefault: () => { } } as SyntheticEvent
    onSearchSubmit(mockFormEvent, symbol)
  }

  return (
    <section className="relative mb-2 mt-6 w-full max-w-3xl px-2 font-sans">
      <form
        className="relative flex w-full items-center"
        onSubmit={onSearchSubmit}
      >
        <div className="pointer-events-none absolute left-5 flex items-center justify-center text-band-subtle">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          className="w-full rounded-pill ring-1 ring-inset ring-band-line/8 bg-band-surface py-4 pl-14 pr-32 text-body font-normal text-band-ink outline-none transition-colors duration-200 placeholder:text-band-subtle focus:border-cobalt focus:ring-2 focus:ring-cobalt/25"
          id="search-input"
          placeholder={t("search.input.placeholder")}
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete="off"
        />

        <button
          type="submit"
          className={`absolute right-2 ${ctaCompactClass}`}
        >
          {t("search.input.submit")}
        </button>
      </form>

      {showSuggestions && (
        <div className="absolute left-2 right-2 z-50 mt-2 flex max-h-80 flex-col overflow-y-auto rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6 text-left shadow-subtle">
          <div className="border-b border-band-line/8 px-4 py-3 font-mono text-caption font-normal uppercase tracking-label text-band-muted">
            {t("search.suggestions.heading")}
          </div>
          {suggestions
            .filter((sym) => sym.toLowerCase().includes((search || "").toLowerCase()))
            .map((symbol) => (
              <div
                key={symbol}
                onMouseDown={() => handleSuggestionClick(symbol)}
                className="cursor-pointer px-4 py-3 font-mono text-body font-normal text-band-ink transition-colors duration-150 hover:bg-band-raised"
              >
                {symbol}
              </div>
            ))}
        </div>
      )}
    </section>
  )
}

export default Search