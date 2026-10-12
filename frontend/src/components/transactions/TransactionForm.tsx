import { useState, useEffect } from 'react'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { detectCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Transaction, TransactionPayload } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
}

const empty = (): TransactionPayload => ({
  ticker: '',
  type: 'buy',
  date: new Date().toISOString().slice(0, 10),
  shares: 0,
  price_per_share: 0,
  currency: 'USD',
  commission_pct: 0.25,
})

function fromTx(tx: Transaction): TransactionPayload {
  return {
    ticker: tx.ticker,
    type: tx.type,
    date: tx.date,
    shares: parseFloat(tx.shares),
    price_per_share: parseFloat(tx.price_per_share),
    currency: tx.currency,
    commission_pct: parseFloat(tx.commission_pct),
    notes: tx.notes,
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors'

function toDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function toISO(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

function DateInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [display, setDisplay] = useState(() => toDisplay(value))

  useEffect(() => {
    setDisplay(toDisplay(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    setDisplay(formatted)
    const iso = toISO(formatted)
    if (iso) onChange(iso)
  }

  return (
    <input
      type="text"
      placeholder="DD/MM/YYYY"
      value={display}
      onChange={handleChange}
      maxLength={10}
      className={className}
    />
  )
}

export function TransactionForm({ open, onClose, editing }: Props) {
  const [form, setForm] = useState<TransactionPayload>(empty)
  const create = useCreateTransaction()
  const update = useUpdateTransaction()

  // Re-initialize form every time the dialog opens
  useEffect(() => {
    if (open) {
      setForm(editing ? fromTx(editing) : empty())
    }
  }, [open, editing])

  const isEdit = !!editing

  function set<K extends keyof TransactionPayload>(key: K, value: TransactionPayload[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleTickerChange(v: string) {
    set('ticker', v)
    set('currency', detectCurrency(v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, ticker: form.ticker.toUpperCase().trim() }
    if (isEdit) {
      await update.mutateAsync({ id: editing!.id, payload })
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Ticker">
            <input
              className={inputClass}
              placeholder="AAPL, AMXL.MX…"
              value={form.ticker}
              onChange={e => handleTickerChange(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <div className="flex rounded-md overflow-hidden border border-border">
                {(['buy', 'sell'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`flex-1 py-2 text-sm capitalize transition-colors ${
                      form.type === t ? 'bg-accent text-white' : 'text-muted hover:text-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`Currency (${form.currency})`}>
              <input className={inputClass} value={form.currency} readOnly />
            </Field>
          </div>

          <Field label="Date">
            <DateInput
              value={form.date}
              onChange={v => set('date', v)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Shares">
              <input
                type="number"
                step="any"
                min="0"
                className={inputClass}
                value={form.shares || ''}
                onChange={e => set('shares', parseFloat(e.target.value))}
                required
              />
            </Field>
            <Field label={`Price (${form.currency})`}>
              <input
                type="number"
                step="any"
                min="0"
                className={inputClass}
                value={form.price_per_share || ''}
                onChange={e => set('price_per_share', parseFloat(e.target.value))}
                required
              />
            </Field>
          </div>

          <Field label="Commission %">
            <input
              type="number"
              step="any"
              min="0"
              className={inputClass}
              value={form.commission_pct}
              onChange={e => set('commission_pct', parseFloat(e.target.value))}
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
