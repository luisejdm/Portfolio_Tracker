import { useState } from 'react'
import { Search } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface Props {
  onSearch: (ticker: string) => void
}

export function TickerSearch({ onSearch }: Props) {
  const [value, setValue] = useState('')
  const accentColor = useUIStore(s => s.accentColor)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = value.trim().toUpperCase()
    if (t) onSearch(t)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="w-full bg-surface border border-border rounded-md pl-8 pr-3 py-2 text-sm text-primary focus:outline-none focus:border-accent transition-colors"
          placeholder="AAPL, BIMBOA.MX…"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-white rounded-md transition-opacity"
        style={{ backgroundColor: accentColor }}
      >
        Search
      </button>
    </form>
  )
}
