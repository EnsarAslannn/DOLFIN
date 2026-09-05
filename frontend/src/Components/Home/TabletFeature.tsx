import { useId, useState } from "react"
import { motion } from "framer-motion"
import tabletInHand from "../../assets/extra/tablet-dashboard.webp"
import { bandClass } from "../../Helpers/layout"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import {
  reveal,
  revealGroup,
  revealImage,
  revealProps,
} from "../../Helpers/motion"
import { TONE_ATTR } from "../../Helpers/useSectionTone"
import { useLanguage } from "../../i18n/useLanguage"

const TabletFeature = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()
  const [selected, setSelected] = useState(0)
  const panelId = useId()

  const capabilities = [
    {
      step: "01",
      title: t("home.tablet.1.title"),
      copy: t("home.tablet.1.copy"),
    },
    {
      step: "02",
      title: t("home.tablet.2.title"),
      copy: t("home.tablet.2.copy"),
    },
    {
      step: "03",
      title: t("home.tablet.3.title"),
      copy: t("home.tablet.3.copy"),
    },
    {
      step: "04",
      title: t("home.tablet.4.title"),
      copy: t("home.tablet.4.copy"),
    },
  ]

  return (
    <section
      {...{ [TONE_ATTR]: "light" }}
      className={`overflow-hidden bg-cream-canvas ${bandClass}`}
    >
      <div className="grid grid-cols-1 items-center lg:grid-cols-2">
        <motion.div
          variants={revealGroup}
          {...revealProps(prefersReducedMotion)}
          className="order-2 py-16 lg:order-1 lg:py-section"
        >
          <div className="mx-auto w-full max-w-[720px] px-6 sm:px-10 lg:ml-auto lg:mr-0 lg:pl-16 lg:pr-12 xl:pl-20">
            <motion.span
              variants={reveal}
              className="block font-mono text-caption font-normal uppercase tracking-label-lg text-ink-muted"
            >
              {t("home.tablet.eyebrow")}
            </motion.span>
            <motion.h2
              variants={reveal}
              className="mt-5 text-heading font-medium text-onyx-canvas md:text-heading-lg"
            >
              {t("home.tablet.title")}
            </motion.h2>
            <motion.p
              variants={reveal}
              className="mt-6 max-w-[46ch] text-body-lg font-normal text-ink-muted"
            >
              {t("home.tablet.lead")}
            </motion.p>

            <motion.ul variants={reveal} className="mt-10 flex flex-col">
              {capabilities.map((item, index) => {
                const isSelected = index === selected

                return (
                  <li key={item.step}>
                    <button
                      type="button"
                      onClick={() => setSelected(index)}
                      aria-expanded={isSelected}
                      aria-controls={`${panelId}-${index}`}
                      className={`flex w-full cursor-pointer items-baseline gap-4 border-l-2 py-3 pl-4 text-left transition-colors duration-200 ${
                        isSelected
                          ? "border-cobalt"
                          : "border-onyx-canvas/20 hover:border-onyx-canvas/45"
                      }`}
                    >
                      <span
                        className={`font-mono text-caption font-normal transition-colors duration-200 ${
                          isSelected ? "text-cobalt" : "text-ink-muted"
                        }`}
                      >
                        {item.step}
                      </span>
                      <span
                        className={`text-body-lg font-normal transition-colors duration-200 ${
                          isSelected ? "text-onyx-canvas" : "text-ink-muted"
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>

                    <div
                      id={`${panelId}-${index}`}
                      role="region"
                      aria-label={item.title}
                      hidden={!isSelected}
                      className="border-l-2 border-cobalt pb-4 pl-4"
                    >
                      <p className="max-w-[44ch] pl-9 text-body font-normal text-ink-muted">
                        {item.copy}
                      </p>
                    </div>
                  </li>
                )
              })}
            </motion.ul>
          </div>
        </motion.div>

        <motion.div
          variants={revealImage}
          {...revealProps(prefersReducedMotion)}
          className="order-1 lg:order-2 lg:h-full"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden lg:h-full lg:min-h-[720px] lg:aspect-auto">
            <img
              src={tabletInHand}
              alt={t("home.tablet.image.alt")}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-cream-canvas via-cream-canvas/20 to-transparent lg:via-cream-canvas/5"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TabletFeature
