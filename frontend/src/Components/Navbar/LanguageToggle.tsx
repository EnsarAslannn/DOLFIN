import { useLanguage } from "../../i18n/useLanguage"
import { LANGUAGES, type Language } from "../../i18n/types"

type Props = {
  isLight: boolean
}

// The label is the affordance here, so the two codes stay readable in both
// navbar tones rather than dimming to the point of being decorative.
const LanguageToggle = ({ isLight }: Props) => {
  const { language, setLanguage, t } = useLanguage()

  const idleClass = isLight
    ? "text-ink-muted hover:text-onyx-canvas"
    : "text-ash-text hover:text-ivory-text"

  const activeClass = "text-cobalt"

  const buttonClass = (lang: Language) =>
    `flex h-11 cursor-pointer items-center rounded-card px-2 font-mono text-caption font-normal uppercase tracking-label-sm transition-colors duration-200 ${
      language === lang ? activeClass : idleClass
    }`

  return (
    <div
      role="group"
      aria-label={t("lang.toggle.label")}
      className="-ml-2 flex shrink-0 items-center"
    >
      {LANGUAGES.map((lang, index) => (
        <span key={lang} className="flex items-center">
          {index > 0 && (
            <span
              aria-hidden="true"
              className={`select-none text-caption ${
                isLight ? "text-onyx-canvas/25" : "text-mist-border/30"
              }`}
            >
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => setLanguage(lang)}
            aria-pressed={language === lang}
            title={t(lang === "tr" ? "lang.tr.full" : "lang.en.full")}
            className={buttonClass(lang)}
          >
            {lang}
          </button>
        </span>
      ))}
    </div>
  )
}

export default LanguageToggle
