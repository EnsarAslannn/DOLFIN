import { PanelHeader } from "../../Dashboard/Panel"
import EmptyState from "../../Dashboard/EmptyState"
import Reveal from "../../Dashboard/Reveal"
import type { Transaction, TransactionType } from "../../../Models/Portfolio"

type Props = {
  transactions: Transaction[]
}

// Money leaving the wallet reads as a debit, money arriving as a credit --
// buying a stock spends cash, selling one returns it.
const isDebit = (type: TransactionType) => type === "BUY" || type === "WITHDRAW"

const badgeClass = (type: TransactionType) =>
  isDebit(type)
    ? "text-band-loss ring-band-loss/30"
    : "text-band-gain ring-band-gain/30"

const formatTimestamp = (timestamp: string) => {
  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) return "—"

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const TransactionHistory = ({ transactions }: Props) => (
  <div className="flex flex-col gap-8">
    <Reveal>
      <PanelHeader
        eyebrow="Activity"
        title="Transaction history"
        lead={
          transactions.length > 0
            ? "Every trade, deposit and withdrawal on this account, newest first."
            : undefined
        }
      />
    </Reveal>

    {transactions.length > 0 ? (
      <div className="overflow-hidden rounded-card bg-band-surface ring-1 ring-inset ring-band-line/6">
        <div className="overflow-x-auto">
          <table aria-label="Transaction history" className="w-full border-collapse text-left font-sans">
            <thead>
              <tr className="border-b border-band-line/8 font-mono text-caption font-bold uppercase tracking-label-lg text-band-muted">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4 text-right">Quantity</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-band-line/8 text-body font-normal">
              {transactions.map((item) => {
                const isCash = item.symbol.toUpperCase() === "CASH"

                return (
                  <tr key={item.id} className="transition-colors hover:bg-band-raised">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-caption font-normal text-band-muted">
                      {formatTimestamp(item.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-pill px-3 py-1 font-mono text-caption font-bold uppercase tracking-label ring-1 ring-inset ${badgeClass(
                          item.transactionType,
                        )}`}
                      >
                        {item.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-body font-normal text-band-ink">
                          {item.companyName}
                        </span>
                        <span className="font-mono text-caption font-normal tracking-wide text-band-muted">
                          {item.symbol.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-body font-normal text-band-muted">
                      {isCash ? "—" : item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-body font-normal text-band-muted">
                      {isCash ? "—" : `$${item.price.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-body font-normal text-band-ink">
                      {isDebit(item.transactionType) ? "-" : "+"}$
                      {item.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <EmptyState
        variant="wallet"
        title="Nothing has happened yet"
        description="Deposit cash or place your first trade and every movement will be logged here."
      />
    )}
  </div>
)

export default TransactionHistory
