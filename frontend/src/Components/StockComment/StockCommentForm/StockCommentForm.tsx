import { useEffect, useMemo } from "react"
import * as Yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm, useWatch } from "react-hook-form"
import {
  fieldClass,
  labelClass,
  errorClass,
  ctaBaseClass,
  ctaFillClass,
  ctaDisabledClass,
} from "../../../Helpers/formStyles"
import type { StockOption } from "../stockOptions"
import { useLanguage } from "../../../i18n/useLanguage"

export type CommentFormInputs = {
  stockId: string
  title: string
  content: string
}

type Props = {
  stocks: StockOption[]
  defaultStockId?: number
  submitting?: boolean
  handleComment: (e: CommentFormInputs) => void
}

const StockCommentForm = ({
  stocks,
  defaultStockId,
  submitting = false,
  handleComment,
}: Props) => {
  const { t } = useLanguage()

  // Rebuilt per language so a switch re-labels any error already on screen.
  const validation = useMemo(
    () =>
      Yup.object().shape({
        stockId: Yup.string().required(t("comments.validation.stock")),
        title: Yup.string()
          .required(t("comments.validation.title"))
          .min(5, t("comments.validation.title.min"))
          .max(280, t("comments.validation.title.max")),
        content: Yup.string()
          .required(t("comments.validation.content"))
          .min(5, t("comments.validation.content.min"))
          .max(280, t("comments.validation.content.max")),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    resetField,
    setValue,
    control,
    formState: { errors, isSubmitSuccessful },
  } = useForm<CommentFormInputs>({
    resolver: yupResolver(validation),
    defaultValues: {
      stockId: defaultStockId ? String(defaultStockId) : "",
      title: "",
      content: "",
    },
  })

  useEffect(() => {
    if (defaultStockId) setValue("stockId", String(defaultStockId))
  }, [defaultStockId, setValue])

  useEffect(() => {
    if (isSubmitSuccessful) {
      resetField("title")
      resetField("content")
    }
  }, [isSubmitSuccessful, resetField])

  const content = useWatch({ control, name: "content" })
  const remaining = 280 - (content?.length ?? 0)

  const noStocks = stocks.length === 0

  return (
    <form
      className="mt-6 flex flex-col gap-5"
      onSubmit={handleSubmit(handleComment)}
    >
      <div className="w-full text-left">
        <label htmlFor="comment-stock" className={labelClass}>
          {t("comments.form.stock")}
        </label>
        <select
          id="comment-stock"
          className={`${fieldClass} cursor-pointer`}
          aria-invalid={errors.stockId ? "true" : undefined}
          {...register("stockId")}
        >
          <option value="">{t("comments.form.selectCompany")}</option>
          {stocks.map((stock) => (
            <option key={stock.id} value={stock.id}>
              {stock.symbol}
              {stock.companyName ? ` — ${stock.companyName}` : ""}
            </option>
          ))}
        </select>
        {errors.stockId && <p className={errorClass}>{errors.stockId.message}</p>}
      </div>

      <div className="w-full text-left">
        <label htmlFor="comment-title" className={labelClass}>
          {t("comments.form.titleLabel")}
        </label>
        <input
          type="text"
          id="comment-title"
          maxLength={280}
          className={fieldClass}
          placeholder={t("comments.form.titlePlaceholder")}
          aria-invalid={errors.title ? "true" : undefined}
          {...register("title")}
        />
        {errors.title && <p className={errorClass}>{errors.title.message}</p>}
      </div>

      <div className="w-full text-left">
        <label htmlFor="comment-content" className={labelClass}>
          {t("comments.form.contentLabel")}
        </label>
        <textarea
          id="comment-content"
          rows={5}
          maxLength={280}
          className={`${fieldClass} resize-none`}
          placeholder={t("comments.form.contentPlaceholder")}
          aria-invalid={errors.content ? "true" : undefined}
          {...register("content")}
        />
        <div className="mt-2 flex items-start justify-between gap-4">
          {errors.content ? (
            <p className={`${errorClass} mt-0`}>{errors.content.message}</p>
          ) : (
            <span />
          )}
          <span
            aria-hidden="true"
            className="shrink-0 font-mono text-caption font-normal text-band-subtle"
          >
            {remaining}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || noStocks}
        className={`self-start px-6 py-3 text-body ${ctaBaseClass} ${
          submitting || noStocks ? ctaDisabledClass : ctaFillClass
        }`}
      >
        {submitting ? t("comments.form.posting") : t("comments.form.submit")}
      </button>
    </form>
  )
}

export default StockCommentForm
