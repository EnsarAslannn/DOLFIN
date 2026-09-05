import { dictionaries, type TranslationKey } from "./translations"
import { DEFAULT_LANGUAGE, STORAGE_KEY, isLanguage, type Language } from "./types"

export type TranslateVars = Record<string, string | number>

export type Translate = (key: TranslationKey, vars?: TranslateVars) => string

const interpolate = (template: string, vars?: TranslateVars) => {
  if (!vars) return template

  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

// A missing Turkish string falls through to English rather than rendering the
// key, so a gap in the dictionary reads as untranslated copy, not as a bug.
export const translate = (
  lang: Language,
  key: TranslationKey,
  vars?: TranslateVars,
): string => {
  const template = dictionaries[lang][key] ?? dictionaries.en[key]

  if (template === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] missing translation for "${key}"`)
    }
    return key
  }

  return interpolate(template, vars)
}

export const createTranslator =
  (lang: Language): Translate =>
  (key, vars) =>
    translate(lang, key, vars)

// Read outside React for the few places that need a language before the
// provider mounts -- the error boundary, and the stored preference itself.
export const readStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(stored)) return stored
  } catch {
    // Private browsing or a blocked storage partition: fall through.
  }

  return DEFAULT_LANGUAGE
}

export const writeStoredLanguage = (lang: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Not being able to remember the choice is survivable; the session still
    // switches, it just starts from the default next time.
  }
}
