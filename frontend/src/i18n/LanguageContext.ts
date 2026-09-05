import { createContext } from "react"
import { createTranslator, type Translate } from "./translate"
import { DEFAULT_LANGUAGE, type Language } from "./types"

export type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translate
}

// Defaulting to a working Turkish translator means a component rendered
// outside the provider -- a unit test, say -- still shows real copy.
export const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: createTranslator(DEFAULT_LANGUAGE),
})
