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

type RegisterFormsInputs = {
  email: string
  userName: string
  password: string
}

const RegisterPage = () => {
  const { registerUser } = useAuth()
  const { t } = useLanguage()

  // Rebuilt per language so a switch re-labels any error already on screen.
  const validation = useMemo(
    () =>
      Yup.object().shape({
        email: Yup.string().required(t("auth.validation.email")),
        userName: Yup.string().required(t("auth.validation.username")),
        password: Yup.string()
          .required(t("auth.validation.password"))
          .min(12, t("auth.validation.password.min"))
          .matches(/[A-Z]/, t("auth.validation.password.case"))
          .matches(/[0-9]/, t("auth.validation.password.digit"))
          .matches(/[^a-zA-Z0-9]/, t("auth.validation.password.special")),
      }),
    [t],
  )

  const passwordRules = [
    t("auth.rules.1"),
    t("auth.rules.2"),
    t("auth.rules.3"),
    t("auth.rules.4"),
  ]

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormsInputs>({ resolver: yupResolver(validation) })

  const handleRegister = (form: RegisterFormsInputs) => {
    registerUser(form.email, form.userName, form.password)
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
            {t("auth.register.aside.eyebrow")}
          </span>
          <h2 className="max-w-md text-heading md:text-heading-lg font-normal text-ivory-text">
            {t("auth.register.aside.title")}
          </h2>
          <p className="mt-5 max-w-sm text-body-lg font-normal text-ivory-text/85">
            {t("auth.register.aside.lead")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-20 pt-28 sm:px-12">
        <div className="w-full sm:max-w-[420px]">
          <div className="mb-12">
            <span className="block font-mono text-caption font-normal uppercase tracking-label-lg text-ash-text/70">
              {t("auth.register.eyebrow")}
            </span>
            <h1 className="mt-5 text-heading md:text-heading-lg font-normal text-ivory-text">
              {t("auth.register.title")}
            </h1>
            <p className="mt-5 text-body-lg font-normal text-ash-text">
              {t("auth.register.lead")}
            </p>
          </div>

            <form className="space-y-8" onSubmit={handleSubmit(handleRegister)}>
              <div>
                <label htmlFor="email" className={labelClass}>
                  {t("auth.field.email")}
                </label>
                <input
                  type="text"
                  id="email"
                  className={fieldClass}
                  placeholder={t("auth.field.email")}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className={errorClass}>{errors.email.message}</p>
                ) : (
                  ""
                )}
              </div>
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
                <div className="mt-3 rounded-card bg-obsidian-button p-4">
                  <p className="font-mono text-caption font-normal uppercase tracking-label text-ash-text">
                    {t("auth.rules.heading")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-body font-normal text-ash-text">
                    {passwordRules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
                {errors.password ? (
                  <p className={errorClass}>{errors.password.message}</p>
                ) : (
                  ""
                )}
              </div>
              <button type="submit" className={primaryButtonClass}>
                {t("auth.register.submit")}
              </button>
              <p className="border-t border-mist-border/8 pt-8 text-body font-normal text-ash-text">
                {t("auth.register.hasAccount")}{" "}
                <Link
                  to="/login"
                  className="cursor-pointer text-ivory-text underline underline-offset-4"
                >
                  {t("auth.register.login")}
                </Link>
              </p>
            </form>
        </div>
      </div>
    </section>
  )
}

export default RegisterPage
