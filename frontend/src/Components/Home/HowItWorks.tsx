import { motion } from "framer-motion"
import atriumLight from "../../assets/extra/atrium-light.webp"
import heroStill from "../../assets/extra/hero-still.webp"
import capitalStack from "../../assets/extra/capital-stack.webp"
import SectionHeader from "../SectionHeader/SectionHeader"
import { bandClass, contentClass } from "../../Helpers/layout"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import {
  reveal,
  revealGroup,
  revealImage,
  revealProps,
} from "../../Helpers/motion"
import { TONE_ATTR } from "../../Helpers/useSectionTone"
import { useLanguage } from "../../i18n/useLanguage"

const HowItWorks = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()

  const stages = [
    {
      step: "01",
      title: t("home.stages.1.title"),
      copy: t("home.stages.1.copy"),
      image: atriumLight,
      scrim: "bg-onyx-canvas/45",
    },
    {
      step: "02",
      title: t("home.stages.2.title"),
      copy: t("home.stages.2.copy"),
      image: heroStill,
      scrim: "bg-onyx-canvas/20",
    },
    {
      step: "03",
      title: t("home.stages.3.title"),
      copy: t("home.stages.3.copy"),
      image: capitalStack,
      scrim: "bg-onyx-canvas/20",
    },
  ]

  return (
    <section
      id="how-it-works"
      {...{ [TONE_ATTR]: "dark" }}
      className={`bg-onyx-canvas py-section ${bandClass}`}
    >
      <div className={contentClass}>
        <motion.div
          variants={revealGroup}
          {...revealProps(prefersReducedMotion)}
        >
          <SectionHeader
            align="center"
            eyebrow={t("home.stages.eyebrow")}
            title={t("home.stages.title")}
            lead={t("home.stages.lead")}
          />
        </motion.div>

        <motion.ol
          variants={revealGroup}
          {...revealProps(prefersReducedMotion)}
          className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3"
        >
          {stages.map((stage) => (
            <motion.li
              key={stage.step}
              variants={revealGroup}
              className="group flex flex-col"
            >
              <motion.div
                variants={revealImage}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-graphite-card"
              >
                <img
                  src={stage.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 ${stage.scrim}`}
                />

                <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-icon bg-obsidian-button/85 font-mono text-caption font-normal text-ivory-text backdrop-blur-sm">
                  {stage.step}
                </span>
              </motion.div>

              <motion.h3
                variants={reveal}
                className="mt-6 text-heading-sm font-medium text-ivory-text"
              >
                {stage.title}
              </motion.h3>
              <motion.p
                variants={reveal}
                className="mt-3 max-w-[34ch] text-body font-normal text-ash-text"
              >
                {stage.copy}
              </motion.p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}

export default HowItWorks
