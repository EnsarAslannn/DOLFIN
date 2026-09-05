import { useMemo } from "react"
import * as Yup from "yup"
import { useAuth } from "../../Context/useAuth"
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import authSkyline from "../../assets/extra/auth-office.webp"
import { useLanguage } from "../../i18n/useLanguage"
import {
  fieldClass,
  labelClass,
  errorClass,
  primaryButtonClass,
} from "../../Helpers/formStyles"

type LoginFormsInputs = {
  userName: string
  password: string
}

const LoginPage = () => {
  const { loginUser } = useAuth()
  const { t } = useLanguage()

  // Rebuilt per language so a switch re-labels any error already on screen.
  const validation = useMemo(
    () =>
      Yup.object().shape({
        userName: Yup.string().required(t("auth.validation.username")),
        password: Yup.string().required(t("auth.validation.password")),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormsInputs>({ resolver: yupResolver(validation) })

  const handleLogin = (form: LoginFormsInputs) => {
    loginUser(form.userName, form.password)
  }

  return (
    <section className="flex min-h-screen items-stretch bg-onyx-canvas font-sans">
      <div className="relative hidden w-1/2 overflow-hidden lg:block xl:w-[55%]">
        <img
          src={authSkyline}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-onyx-canvas/55" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-onyx-canvas/85 via-onyx-canvas/25 to-onyx-canvas/70"
        />

        <div className="relative z-10 flex h-full flex-col justify-end p-14">
          <span className="mb-5 font-mono text-caption font-normal uppercase tracking-label-lg text-ivory-text/75">
            {t("auth.login.aside.eyebrow")}
          </span>
          <h2 className="max-w-md text-heading md:text-heading-lg font-normal text-ivory-text">
            {t("auth.login.aside.title")}
          </h2>
          <p className="mt-5 max-w-sm text-body-lg font-normal text-ivory-text/85">
            {t("auth.login.aside.lead")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-20 pt-28 sm:px-12">
        <div className="w-full sm:max-w-[420px]">
          <div className="mb-12">
            <span className="block font-mono text-caption font-normal uppercase tracking-label-lg text-ash-text/70">
              {t("auth.login.eyebrow")}
            </span>
            <h1 className="mt-5 text-heading md:text-heading-lg font-normal text-ivory-text">
              {t("auth.login.title")}
            </h1>
            <p className="mt-5 text-body-lg font-normal text-ash-text">
              {t("auth.login.lead")}
            </p>
          </div>

            <form className="space-y-8" onSubmit={handleSubmit(handleLogin)}>
              <div>
                <label htmlFor="username" className={labelClass}>
                  {t("auth.field.username")}
                </label>
                <input
                  type="text"
                  id="username"
                  className={fieldClass}
                  placeholder={t("auth.field.username")}
                  {...register("userName")}
                />
                {errors.userName ? (
                  <p className={errorClass}>{errors.userName.message}</p>
                ) : (
                  ""
                )}
              </div>
              <div>
                <label htmlFor="password" className={labelClass}>
                  {t("auth.field.password")}
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  className={fieldClass}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className={errorClass}>{errors.password.message}</p>
                ) : (
                  ""
                )}
              </div>
              <button type="submit" className={primaryButtonClass}>
                {t("auth.login.submit")}
              </button>
              <p className="border-t border-mist-border/8 pt-8 text-body font-normal text-ash-text">
                {t("auth.login.noAccount")}{" "}
                <Link
                  to="/register"
                  className="cursor-pointer text-ivory-text underline underline-offset-4"
                >
                  {t("auth.login.signUp")}
                </Link>
              </p>
            </form>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
