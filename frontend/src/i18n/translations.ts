import type { Language } from "./types"
import { alerts } from "./locales/alerts"
import { auth } from "./locales/auth"
import { comments } from "./locales/comments"
import { common } from "./locales/common"
import { company } from "./locales/company"
import { home } from "./locales/home"
import { portfolio } from "./locales/portfolio"
import { search } from "./locales/search"
import { wallet } from "./locales/wallet"

const bundles = [
  alerts,
  auth,
  comments,
  common,
  company,
  home,
  portfolio,
  search,
  wallet,
]

// English is the reference bundle: it defines every key the app may ask for,
// so a Turkish string that goes missing falls back to a readable sentence
// rather than letting a raw key leak into the page.
type EnglishBundle = (typeof alerts)["en"] &
  (typeof auth)["en"] &
  (typeof comments)["en"] &
  (typeof common)["en"] &
  (typeof company)["en"] &
  (typeof home)["en"] &
  (typeof portfolio)["en"] &
  (typeof search)["en"] &
  (typeof wallet)["en"]

export type TranslationKey = keyof EnglishBundle & string

const merge = (lang: Language) =>
  Object.assign({}, ...bundles.map((bundle) => bundle[lang])) as Record<
    string,
    string
  >

export const dictionaries: Record<Language, Record<string, string>> = {
  en: merge("en"),
  tr: merge("tr"),
}
