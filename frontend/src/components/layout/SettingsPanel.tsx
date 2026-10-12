import { useUIStore } from '@/store/uiStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

const PRESET_COLORS = ['#4F89FF', '#22C55E', '#A855F7', '#F59E0B', '#EC4899', '#14B8A6']

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    theme, accentColor, pieUsesAccentPalette, fontSize,
    setTheme, setAccentColor, setPieUsesAccentPalette, setFontSize,
  } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted">Text Size</p>
              <span className="text-xs text-muted tabular-nums">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={12}
              max={18}
              step={1}
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted">A</span>
              <span className="text-base text-muted">A</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted mb-2">Theme</p>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(t => (
                <Button
                  key={t}
                  variant={theme === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted mb-2">Pie Chart Colors</p>
            <div className="flex gap-2">
              {([true, false] as const).map(v => (
                <Button
                  key={String(v)}
                  variant={pieUsesAccentPalette === v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPieUsesAccentPalette(v)}
                >
                  {v ? 'Accent palette' : 'Multi-color'}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted mb-2">Accent Color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all',
                    accentColor === color ? 'border-white scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
