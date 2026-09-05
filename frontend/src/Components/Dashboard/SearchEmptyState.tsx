import { motion } from "framer-motion"
import emptySearch from "../../assets/extra/empty-search.webp"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import { reveal, revealProps } from "../../Helpers/motion"
import { useLanguage } from "../../i18n/useLanguage"

interface Props {
  title?: string
  description?: string
}

const SearchEmptyState = ({ title, description }: Props) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()

  const heading = title ?? t("search.empty.title")
  const body = description ?? t("search.empty.description")

  return (
    <motion.div
      variants={reveal}
      {...revealProps(prefersReducedMotion)}
      data-band="dark"
      className="relative w-full overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-3/5 bg-contain bg-right bg-no-repeat sm:block"
        style={{ backgroundImage: `url(${emptySearch})` }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-band-surface from-45% via-band-surface/80 to-transparent"
      />

      <div className="relative max-w-[34ch] px-7 py-12 sm:max-w-[54%] sm:px-10 sm:py-16 lg:max-w-[50%] lg:px-12 lg:py-20">
        <h3 className="text-heading-sm font-medium text-band-ink">{heading}</h3>
        <p className="mt-4 text-body font-normal leading-relaxed text-band-muted">
          {body}
        </p>
      </div>
    </motion.div>
  )
}

export default SearchEmptyState
