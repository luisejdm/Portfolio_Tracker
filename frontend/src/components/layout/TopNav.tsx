import { NavLink } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

interface TopNavProps {
  onSettingsOpen: () => void
}

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/explorer', label: 'Explorer' },
]

export function TopNav({ onSettingsOpen }: TopNavProps) {
  const accentColor = useUIStore(s => s.accentColor)

  return (
    <header className="h-12 border-b border-border bg-surface flex items-center px-6 sticky top-0 z-40">
      <span className="font-semibold text-sm text-primary mr-8 shrink-0">Portfolio Tracker</span>

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
