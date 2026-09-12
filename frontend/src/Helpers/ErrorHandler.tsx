import axios from "axios"
import { toast } from "react-toastify"
import { readStoredLanguage, translate } from "../i18n"
import { notifySessionExpired } from "./sessionEvents"
import type { TranslationKey } from "../i18n"

type HandleErrorOptions = {
   /**
    * Whether a 401 should be read as "your session is gone" and bounce the
    * caller to the login page. True for every request made on behalf of an
    * established session; false for the sign-in and sign-up calls themselves,
    * where a 401 means "these credentials were rejected" -- redirecting there
    * reloads the page the user is already standing on and throws away the
    * reason the server gave.
    */
   redirectOnUnauthorized?: boolean
}

/**
 * The body the API returns for an error it raised deliberately: a stable code
 * plus the English sentence, and the figures the sentence interpolates.
 */
type ApiError = {
   code?: unknown
   message?: unknown
   args?: unknown
}

// This runs outside React, so it reads the stored preference rather than the
// context -- the same route the error boundary takes. The provider writes to
// storage on every switch, so it is never behind.
const say = (key: string, vars?: Record<string, string>) =>
   translate(readStoredLanguage(), key as TranslationKey, vars)

const isRecord = (value: unknown): value is Record<string, unknown> =>
   typeof value === "object" && value !== null

const readApiError = (body: unknown): ApiError | undefined => {
   if (!isRecord(body)) return undefined
   if (typeof body.code !== "string" || body.code.length === 0) return undefined
   return body as ApiError
}

const readArgs = (args: unknown): Record<string, string> | undefined => {
   if (!isRecord(args)) return undefined

   const entries = Object.entries(args).filter(
      ([, value]) => typeof value === "string" || typeof value === "number",
   )
   if (entries.length === 0) return undefined

   return Object.fromEntries(entries.map(([key, value]) => [key, String(value)]))
}

/**
 * Turns an API error code into a sentence in the reader's language, falling
 * back to the English one the server sent when the code is not in the
 * dictionary yet. A code the client has never heard of therefore reads as
 * untranslated copy rather than as an empty toast.
 */
const messageForApiError = (apiError: ApiError): string => {
   const code = String(apiError.code)
   const key = `error.${code}` as TranslationKey
   const translated = say(key, readArgs(apiError.args))

   if (translated !== key) return translated

   return typeof apiError.message === "string" && apiError.message.length > 0
      ? apiError.message
      : say("error.unexpected")
}

export const handleError = (
   error: unknown,
   { redirectOnUnauthorized = true }: HandleErrorOptions = {},
) => {
   if (!axios.isAxiosError(error)) return

   const err = error.response

   // A request that never reached the API stays silent, as it always has.
   // Whether that is right is a separate question from which language the
   // answer is in.
   if (!err) return

   const errors = err.data?.errors
   if (Array.isArray(errors)) {
      for (const val of errors) {
         toast.warning(val.description)
      }
      return
   }

   if (typeof errors == "object" && errors) {
      for (const e in errors) {
         toast.warning(errors[e][0])
      }
      return
   }

   if (err.status == 401 && redirectOnUnauthorized) {
      // Handed to the app shell rather than acted on here. Assigning
      // window.location.href reloaded the entire application to reach a page
      // the router already knows, taking whatever was on screen with it --
      // including a half-filled form the user could otherwise have come back
      // to after signing in again.
      notifySessionExpired()
      return
   }

   const apiError = readApiError(err.data)
   if (apiError) {
      toast.warning(messageForApiError(apiError))
      return
   }

   toast.warning(typeof err.data === "string" ? err.data : say("error.unexpected"))
}
