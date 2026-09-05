import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import marketSkyline from "../../assets/extra/market-skyline.webp"
import { bandClass, contentClass } from "../../Helpers/layout"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import { reveal, revealGroup, revealProps } from "../../Helpers/motion"
import { ctaClass, ctaGhostFullClass } from "../../Helpers/formStyles"
import { TONE_ATTR } from "../../Helpers/useSectionTone"
import { useLanguage } from "../../i18n/useLanguage"
import { Check, Chevron } from "./Icons"

const CreateAccount = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()

  const assurances = [
    t("home.cta.assurance1"),
    t("home.cta.assurance2"),
    t("home.cta.assurance3"),
  ]

  return (
    <section
      id="create-account"
      {...{ [TONE_ATTR]: "dark" }}
      className={`relative overflow-hidden bg-onyx-canvas ${bandClass}`}
    >
      <img
        src={marketSkyline}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-onyx-canvas/80" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-onyx-canvas/75 via-transparent to-onyx-canvas/85"
      />

      <motion.div
        variants={revealGroup}
        {...revealProps(prefersReducedMotion)}
        className={`relative z-10 flex flex-col items-center py-section text-center ${contentClass}`}
      >
        <motion.span
          variants={reveal}
          className="font-mono text-caption font-normal uppercase tracking-label-lg text-ash-text"
        >
          {t("home.cta.eyebrow")}
        </motion.span>

        <motion.h2
          variants={reveal}
          className="mt-7 max-w-[18ch] text-heading font-medium text-ivory-text md:text-heading-lg lg:text-display-sm"
        >
          {t("home.cta.title")}
        </motion.h2>

        <motion.p
          variants={reveal}
          className="mt-7 max-w-[500px] text-body-lg font-normal text-ash-text"
        >
          {t("home.cta.lead")}
        </motion.p>

        <motion.div
          variants={reveal}
          className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <Link
            to="/register"
            className={`inline-flex items-center justify-center gap-2 ${ctaClass}`}
          >
            {t("home.cta.primary")}
            <Chevron className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className={`inline-flex items-center justify-center ${ctaGhostFullClass}`}
          >
            {t("home.cta.secondary")}
          </Link>
        </motion.div>

        <motion.ul
          variants={reveal}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {assurances.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-caption font-normal text-ash-text"
            >
              <Check className="h-3 w-3" />
              {item}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  )
}

export default CreateAccount
