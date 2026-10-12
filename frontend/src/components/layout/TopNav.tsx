import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Settings, ChevronDown, Check, Plus, Trash2, Pencil } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { usePortfolios, useCreatePortfolio, useSwitchPortfolio, useDeletePortfolio, useRenamePortfolio } from '@/hooks/usePortfolios'
import { cn } from '@/lib/utils'

interface TopNavProps {
  onSettingsOpen: () => void
}

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/explorer', label: 'Explorer' },
]

function PortfolioSelector() {
  const accentColor = useUIStore(s => s.accentColor)
  const { data } = usePortfolios()
  const createPortfolio = useCreatePortfolio()
  const switchPortfolio = useSwitchPortfolio()
  const deletePortfolio = useDeletePortfolio()
  const renamePortfolio = useRenamePortfolio()

  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setNewName('')
        setError('')
        setEditing(null)
        setEditName('')
        setEditError('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!data) return null

  const { portfolios, active } = data

  async function handleSwitch(name: string) {
    if (name === active) { setOpen(false); return }
    await switchPortfolio.mutateAsync(name)
    setOpen(false)
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(name)) {
      setError('Letters, numbers, - and _ only')
      return
    }
    try {
      await createPortfolio.mutateAsync(name)
      await switchPortfolio.mutateAsync(name)
      setCreating(false)
      setNewName('')
      setError('')
      setOpen(false)
    } catch {
      setError('Name already exists')
    }
  }

  function startEditing(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    setEditing(name)
    setEditName(name)
    setEditError('')
  }

  async function handleRename(oldName: string) {
    const newName = editName.trim()
    if (!newName || newName === oldName) { setEditing(null); return }
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(newName)) {
      setEditError('Letters, numbers, - and _ only')
      return
    }
    try {
      await renamePortfolio.mutateAsync({ name: oldName, newName })
      setEditing(null)
      setEditName('')
      setEditError('')
    } catch {
      setEditError('Name already exists')
    }
  }

  async function handleDelete(name: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (portfolios.length <= 1) return
    await deletePortfolio.mutateAsync(name)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium text-primary hover:bg-border/40 transition-colors"
      >
        <span className="max-w-[120px] truncate">{active}</span>
        <ChevronDown size={13} className={cn('text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            {portfolios.map(name => (
              <div key={name} className="group">
                {editing === name ? (
                  <div className="px-3 py-2 space-y-1">
                    <input
                      autoFocus
                      className="w-full bg-bg border border-border rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent"
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setEditError('') }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.stopPropagation(); handleRename(name) }
                        if (e.key === 'Escape') { setEditing(null); setEditName(''); setEditError('') }
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                    {editError && <p className="text-xs text-red-500">{editError}</p>}
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); handleRename(name) }}
                        disabled={renamePortfolio.isPending}
                        className="flex-1 py-1 text-xs font-medium text-white rounded-md transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: accentColor }}
                      >
                        Save
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setEditing(null); setEditName(''); setEditError('') }}
                        className="px-2 py-1 text-xs text-muted hover:text-primary rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleSwitch(name)}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-border/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {name === active
                        ? <Check size={13} style={{ color: accentColor }} className="shrink-0" />
                        : <span className="w-[13px] shrink-0" />
                      }
                      <span className={cn('truncate', name === active ? 'font-medium text-primary' : 'text-muted')}>
                        {name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => startEditing(name, e)}
                        className="text-muted hover:text-primary transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      {portfolios.length > 1 && name !== active && (
                        <button
                          onClick={e => handleDelete(name, e)}
                          className="text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-3 py-2">
            {creating ? (
              <div className="space-y-1">
                <input
                  autoFocus
                  className="w-full bg-bg border border-border rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:border-accent"
                  placeholder="portfolio-name"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName(''); setError('') } }}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-1">
                  <button
                    onClick={handleCreate}
                    disabled={createPortfolio.isPending}
                    className="flex-1 py-1 text-xs font-medium text-white rounded-md transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: accentColor }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setCreating(false); setNewName(''); setError('') }}
                    className="px-2 py-1 text-xs text-muted hover:text-primary rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors w-full"
              >
                <Plus size={12} />
                New portfolio
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function TopNav({ onSettingsOpen }: TopNavProps) {
  const accentColor = useUIStore(s => s.accentColor)

  return (
    <header className="h-12 border-b border-border bg-surface flex items-center px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2 mr-8 shrink-0">
        <span className="font-semibold text-sm text-primary">Portfolio Tracker</span>
        <PortfolioSelector />
      </div>

      <nav className="flex items-center gap-1 flex-1 justify-center">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                isActive ? 'font-medium' : 'text-muted hover:text-primary',
              )
            }
            style={({ isActive }) => isActive ? { color: accentColor } : {}}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onSettingsOpen}
        className="ml-8 text-muted hover:text-primary transition-colors"
        aria-label="Settings"
      >
        <Settings size={18} />
      </button>
    </header>
  )
}
