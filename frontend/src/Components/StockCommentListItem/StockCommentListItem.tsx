import { motion } from "framer-motion"
import type { CommentGet } from "../../Models/Comment"
import type { StockOption } from "../StockComment/stockOptions"
import { reveal } from "../../Helpers/motion"
import { useLanguage } from "../../i18n/useLanguage"

type Props = {
  comment: CommentGet
  stock?: StockOption
}

const StockCommentListItem = ({ comment, stock }: Props) => {
  const { t } = useLanguage()
  const author = comment.createdBy || t("comments.anonymous")

  return (
    <motion.article
      variants={reveal}
      className="flex flex-col gap-3 rounded-card p-5 text-left ring-1 ring-inset ring-band-line/6 transition-colors duration-200 hover:bg-band-surface"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-icon bg-band-raised font-mono text-caption font-bold uppercase text-band-ink">
          {author[0]}
        </span>
        <span className="text-body font-medium text-band-ink">@{author}</span>
        {stock && (
          <span className="rounded-pill bg-cobalt/15 px-3 py-1 font-mono text-caption font-normal uppercase tracking-label text-band-ink">
            {stock.symbol}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {comment.title && (
          <h4 className="text-body font-medium text-band-ink">
            {comment.title}
          </h4>
        )}
        <p className="text-body font-normal leading-relaxed text-band-muted">
          {comment.content}
        </p>
      </div>
    </motion.article>
  )
}

export default StockCommentListItem
