import type { SyntheticEvent } from "react"
import { useLanguage } from "../../../i18n/useLanguage"

interface Props {
  onPortfolioDelete: (e: SyntheticEvent) => void
  portfolioValue: string
}

const DeletePortfolio = ({ onPortfolioDelete, portfolioValue }: Props) => {
  const { t } = useLanguage()

  return (
    <div>
      <form
        onSubmit={onPortfolioDelete}
        className="flex items-center justify-center"
      >
        <input hidden={true} defaultValue={portfolioValue} />
        <button
          type="submit"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-pill ring-1 ring-inset ring-mist-border/8 bg-graphite-card text-ash-text transition-colors duration-200 hover:border-loss hover:text-loss"
          title={t("portfolio.remove")}
          aria-label={t("portfolio.remove")}
        >
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default DeletePortfolio
