import { type SyntheticEvent } from "react"
import { Link } from "react-router-dom"
import { ctaCompactClass } from "../../../Helpers/formStyles"
import { useAuth } from "../../../Context/useAuth"
import { useLanguage } from "../../../i18n/useLanguage"

type Props = {
  onPortfolioCreate: (e: SyntheticEvent) => void
  symbol: string
}

const AddPortfolio = ({ onPortfolioCreate, symbol }: Props) => {
  const { user } = useAuth()
  const { t } = useLanguage()

  // A visitor can read every row on this page, but buying needs a wallet.
  // Sending them to the sign-in page beats a button that fails on submit.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-end flex-1 space-x-4 space-y-2 md:flex-row md:space-y-0">
        <Link
          to="/login"
          aria-label={t("portfolio.signInToBuy.aria", { symbol })}
          className={`whitespace-nowrap ${ctaCompactClass}`}
        >
          {t("portfolio.signInToBuy")}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-end flex-1 space-x-4 space-y-2 md:flex-row md:space-y-0">
      <form onSubmit={onPortfolioCreate}>
        <input readOnly={true} hidden={true} value={symbol} />
        <button
          type="submit"
          className={ctaCompactClass}
        >
          {t("portfolio.add")}
        </button>
      </form>
    </div>
  )
}

export default AddPortfolio
