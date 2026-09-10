import axios from "axios"
import { toast } from "react-toastify"

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

export const handleError = (
   error: unknown,
   { redirectOnUnauthorized = true }: HandleErrorOptions = {},
) => {
   if (axios.isAxiosError(error)) {
      const err = error.response
      const errors = err?.data?.errors
      if (Array.isArray(errors)) {
         for (const val of errors) {
            toast.warning(val.description)
         }
      } else if (typeof errors == "object" && errors) {
         for (const e in errors) {
            toast.warning(errors[e][0])
         }
      } else if (err?.status == 401 && redirectOnUnauthorized) {
         toast.warning("Please login")
         window.location.href = "/login"
      } else if (err) {
         toast.warning(typeof err.data === "string" ? err.data : "Beklenmeyen bir hata oluştu")
      }
   }
}
