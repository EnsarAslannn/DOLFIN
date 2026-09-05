export type Language = "tr" | "en"

export const LANGUAGES: Language[] = ["tr", "en"]

export const DEFAULT_LANGUAGE: Language = "tr"

export const STORAGE_KEY = "dolfin.language"

export const isLanguage = (value: unknown): value is Language =>
  value === "tr" || value === "en"
