import { useId, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import SectionHeader from "../SectionHeader/SectionHeader"
import { bandClass, contentClass } from "../../Helpers/layout"
import { usePrefersReducedMotion } from "../../Helpers/usePrefersReducedMotion"
import { reveal, revealGroup, revealProps } from "../../Helpers/motion"
import { TONE_ATTR } from "../../Helpers/useSectionTone"
import { useLanguage } from "../../i18n/useLanguage"
import { Chevron, PlusMinus } from "./Icons"

const HelpCenter = () => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const panelId = useId()

  const faqs = [
    { question: t("home.faq.1.q"), answer: t("home.faq.1.a") },
    { question: t("home.faq.2.q"), answer: t("home.faq.2.a") },
    { question: t("home.faq.3.q"), answer: t("home.faq.3.a") },
    { question: t("home.faq.4.q"), answer: t("home.faq.4.a") },
    { question: t("home.faq.5.q"), answer: t("home.faq.5.a") },
  ]

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index)

  return (
    <section
      id="help"
      {...{ [TONE_ATTR]: "light" }}
      className={`bg-cream-canvas py-section ${bandClass}`}
    >
      <div className={contentClass}>
        <motion.div
          variants={revealGroup}
          {...revealProps(prefersReducedMotion)}
        >
          <SectionHeader
            align="center"
            tone="light"
            eyebrow={t("home.faq.eyebrow")}
            title={t("home.faq.title")}
            lead={t("home.faq.lead")}
          />
        </motion.div>

        <motion.div
          variants={revealGroup}
          {...revealProps(prefersReducedMotion)}
          className="mx-auto mt-16 flex max-w-[820px] flex-col gap-2"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <motion.div
                key={faq.question}
                variants={reveal}
                className={`overflow-hidden rounded-card border transition-colors duration-200 ${
                  isOpen
                    ? "border-onyx-canvas/20 bg-pure-white/70"
                    : "border-onyx-canvas/10 bg-pure-white/35 hover:border-onyx-canvas/20"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`${panelId}-${index}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 px-6 py-5 text-left"
                  >
                    <span className="text-body-lg font-medium text-onyx-canvas md:text-subheading">
                      {faq.question}
                    </span>
                    <span
                      className={`shrink-0 transition-colors duration-200 ${
                        isOpen ? "text-cobalt" : "text-ink-muted"
                      }`}
                    >
                      <PlusMinus open={isOpen} className="h-4 w-4" />
                    </span>
                  </button>
                </h3>

                <div
                  id={`${panelId}-${index}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[68ch] px-6 pb-6 text-body font-normal text-ink-muted">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.p
          variants={reveal}
          {...revealProps(prefersReducedMotion)}
          className="mt-12 text-center text-body font-normal text-ink-muted"
        >
          {t("home.faq.stuck")}{" "}
          <Link
            to="/register"
            className="inline-flex items-center gap-1 text-onyx-canvas underline-offset-4 transition-colors duration-200 hover:text-cobalt hover:underline"
          >
            {t("home.faq.stuck.link")}
            <Chevron className="h-3 w-3" />
          </Link>
        </motion.p>
      </div>
    </section>
  )
}

export default HelpCenter
