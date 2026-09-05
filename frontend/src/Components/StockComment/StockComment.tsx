import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { commentGetAPI, commentPostAPI } from "../../Services/CommentService"
import { getAllStocksAPI } from "../../Services/StockService"
import StockCommentForm, {
  type CommentFormInputs,
} from "./StockCommentForm/StockCommentForm"
import StockCommentList from "../StockCommentList/StockCommentList"
import DataLoader from "../Dashboard/DataLoader"
import GuestCallout from "../Dashboard/GuestCallout"
import { PanelHeader } from "../Dashboard/Panel"
import Reveal from "../Dashboard/Reveal"
import { useAuth } from "../../Context/useAuth"
import { useLanguage } from "../../i18n/useLanguage"
import { toStockOption, postableStocks, type StockOption } from "./stockOptions"
import type { CommentGet } from "../../Models/Comment"
import type { StockSearchResult } from "../../Models/StockSearchResult"

const ALL = "all" as const

const StockComment = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stocks, setStocks] = useState<StockOption[]>([])
  const [comments, setComments] = useState<CommentGet[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [filter, setFilter] = useState<number | typeof ALL>(ALL)

  const getComments = useCallback(async () => {
    const res = await commentGetAPI()
    setComments(res?.data ?? [])
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const [stockRes, commentRes] = await Promise.all([
          getAllStocksAPI(),
          commentGetAPI(),
        ])
        if (!active) return

        const options = Array.isArray(stockRes?.data)
          ? (stockRes.data as StockSearchResult[])
              .map(toStockOption)
              .filter((s): s is StockOption => s !== null)
          : []

        setStocks(options)
        setComments(commentRes?.data ?? [])
      } catch (e) {
        console.error("Discussion load failed:", e)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const postable = useMemo(() => postableStocks(stocks), [stocks])

  const symbolById = useMemo(() => {
    const map = new Map<number, StockOption>()
    for (const s of stocks) map.set(s.id, s)
    return map
  }, [stocks])

  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of comments) {
      if (c.stockId === undefined || c.stockId === null) continue
      map.set(c.stockId, (map.get(c.stockId) ?? 0) + 1)
    }
    return map
  }, [comments])

  const chips = useMemo(
    () =>
      [...counts.entries()]
        .map(([id, count]) => ({ stock: symbolById.get(id), id, count }))
        .filter((c): c is { stock: StockOption; id: number; count: number } =>
          Boolean(c.stock),
        )
        .sort((a, b) => b.count - a.count || a.stock.symbol.localeCompare(b.stock.symbol)),
    [counts, symbolById],
  )

  const visible = useMemo(
    () => (filter === ALL ? comments : comments.filter((c) => c.stockId === filter)),
    [comments, filter],
  )

  const handleComment = async (form: CommentFormInputs) => {
    const stock = postable.find((s) => s.id === Number(form.stockId))
    if (!stock) {
      toast.warning(t("comments.toast.pickStock"))
      return
    }

    setPosting(true)
    try {
      const res = await commentPostAPI(form.title, form.content, stock.id)
      if (!res) return
      toast.success(t("comments.toast.posted", { symbol: stock.symbol }))
      await getComments()
      setFilter(stock.id)
    } finally {
      setPosting(false)
    }
  }

  const activeSymbol =
    filter === ALL ? null : (symbolById.get(filter)?.symbol ?? null)

  const chipClass = (isActive: boolean) =>
    `cursor-pointer whitespace-nowrap rounded-pill px-4 py-2 font-mono text-caption font-normal uppercase tracking-label transition-colors duration-200 ${
      isActive
        ? "bg-cobalt text-pure-white"
        : "bg-band-raised text-band-muted hover:text-band-ink"
    }`

  return (
    <section className="flex w-full flex-col gap-8">
      <Reveal>
        <PanelHeader
          eyebrow={t("comments.eyebrow")}
          title={t("comments.title")}
          lead={
            activeSymbol
              ? t(
                  visible.length === 1
                    ? "comments.lead.filtered.one"
                    : "comments.lead.filtered.other",
                  { count: visible.length, symbol: activeSymbol },
                )
              : user
                ? t("comments.lead.user")
                : t("comments.lead.guest")
          }
        />
      </Reveal>

      {chips.length > 0 && (
        <Reveal>
        <div
          role="group"
          aria-label={t("comments.filter.label")}
          className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1"
        >
          <button
            type="button"
            onClick={() => setFilter(ALL)}
            aria-pressed={filter === ALL}
            className={chipClass(filter === ALL)}
          >
            {t("comments.filter.all")} · {comments.length}
          </button>
          {chips.map(({ stock, id, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={chipClass(filter === id)}
            >
              {stock.symbol} · {count}
            </button>
          ))}
        </div>
        </Reveal>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          {loading ? (
            <DataLoader label={t("comments.loading")} />
          ) : (
            <StockCommentList comments={visible} symbolById={symbolById} />
          )}
        </div>

        {user ? (
          <Reveal className="rounded-card bg-band-surface p-6 ring-1 ring-inset ring-band-line/6 lg:col-span-2">
            <h3 className="text-subheading font-medium text-band-ink">
              {t("comments.form.title")}
            </h3>
            <p className="mt-2 text-body font-normal text-band-muted">
              {t("comments.form.lead")}
            </p>
            <StockCommentForm
              stocks={postable}
              defaultStockId={filter === ALL ? undefined : filter}
              submitting={posting}
              handleComment={handleComment}
            />
          </Reveal>
        ) : (
          <div className="lg:col-span-2">
            <GuestCallout
              title={t("comments.guest.title")}
              description={t("comments.guest.description")}
            />
          </div>
        )}
      </div>
    </section>
  )
}

export default StockComment
