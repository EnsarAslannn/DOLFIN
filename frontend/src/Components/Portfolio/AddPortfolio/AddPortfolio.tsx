import { type SyntheticEvent } from "react"
import { Link } from "react-router-dom"
import { ctaCompactClass } from "../../../Helpers/formStyles"
import { useAuth } from "../../../Context/useAuth"

type Props = {
  onPortfolioCreate: (e: SyntheticEvent) => void
  symbol: string
}

const AddPortfolio = ({ onPortfolioCreate, symbol }: Props) => {
  const { user } = useAuth()

  // A visitor can read every row on this page, but buying needs a wallet.
  // Sending them to the sign-in page beats a button that fails on submit.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-end flex-1 space-x-4 space-y-2 md:flex-row md:space-y-0">
        <Link
          to="/login"
          aria-label={`Sign in to buy ${symbol}`}
          className={`whitespace-nowrap ${ctaCompactClass}`}
        >
          Sign in to buy
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
          Add
        </button>
      </form>
    </div>
  )
}

export default AddPortfolio
