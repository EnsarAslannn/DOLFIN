import { Link } from "react-router-dom"
import Reveal from "./Reveal"
import {
  ctaBaseClass,
  ctaFillClass,
  ctaGhostClass,
} from "../../Helpers/formStyles"

type Props = {
  title: string
  description: string
}

// Shown wherever a visitor reaches the edge of what browsing allows. It states
// what is behind the wall rather than only that there is one.
const GuestCallout = ({ title, description }: Props) => (
  <Reveal className="rounded-card bg-band-surface p-8 ring-1 ring-inset ring-band-line/6">
    <span className="block font-mono text-caption font-normal uppercase tracking-label-lg text-band-subtle">
      Guest
    </span>
    <h3 className="mt-3 text-subheading font-medium text-band-ink">{title}</h3>
    <p className="mt-3 max-w-[60ch] text-body font-normal text-band-muted">
      {description}
    </p>
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Link
        to="/register"
        className={`px-6 py-3 text-body ${ctaBaseClass} ${ctaFillClass}`}
      >
        Create account
      </Link>
      <Link
        to="/login"
        className={`px-6 py-3 text-body ${ctaBaseClass} ${ctaGhostClass}`}
      >
        Log in
      </Link>
    </div>
  </Reveal>
)

export default GuestCallout
