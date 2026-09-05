import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { LanguageContext } from "./LanguageContext"
import { createTranslator, readStoredLanguage, writeStoredLanguage } from "./translate"
import type { Language } from "./types"

type Props = {
  children: ReactNode
}

export const LanguageProvider = ({ children }: Props) => {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  // Screen readers and the browser's own translation prompt both key off
  // <html lang>, so it has to follow the choice rather than stay at index.html.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    writeStoredLanguage(next)
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage, t: createTranslator(language) }),
    [language, setLanguage],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export default LanguageProvider
