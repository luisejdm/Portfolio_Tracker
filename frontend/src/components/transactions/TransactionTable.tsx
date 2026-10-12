import { useState } from 'react'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '@/types'

interface Props {
  onEdit: (tx: Transaction) => void
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function fmtAmt(value: number, currency: string): string {
  const num = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  return `${currency} ${num}`
}

export function TransactionTable({ onEdit }: Props) {
  const { data, isLoading } = useTransactions()
  const deleteTx = useDeleteTransaction()
  const [confirmId, setConfirmId] = useState<number | null>(null)

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted text-sm">
        No transactions yet
      </div>
    )
  }

  async function handleDelete(id: number) {
    await deleteTx.mutateAsync(id)
    setConfirmId(null)
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-muted text-xs">
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Ticker</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-right px-4 py-3 font-medium">Shares</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Commission</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map(tx => {
              const shares = parseFloat(tx.shares)
              const price = parseFloat(tx.price_per_share)
              const subtotal = shares * price
              const commissionAmt = subtotal * parseFloat(tx.commission_pct) / 100
              const total = subtotal + commissionAmt
              return (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-muted">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 font-medium text-primary">{tx.ticker}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.type}>{tx.type === 'buy' ? 'Buy' : 'Sell'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-primary">{shares.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-muted">{fmtAmt(price, tx.currency)}</td>
                  <td className="px-4 py-3 text-right text-muted">
                    <span>{fmtAmt(commissionAmt, tx.currency)}</span>
                    <span className="text-xs ml-1 opacity-50">({parseFloat(tx.commission_pct).toFixed(2)}%)</span>
                  </td>
                  <td className="px-4 py-3 text-right text-primary">{fmtAmt(total, tx.currency)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(tx)}>
                        <Pencil size={14} />
                      </Button>
                      {confirmId === tx.id ? (
                        <div className="flex gap-1">
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(tx.id)}>
                            Delete
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setConfirmId(tx.id)}>
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
