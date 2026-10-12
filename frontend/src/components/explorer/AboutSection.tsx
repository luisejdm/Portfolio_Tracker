import type { TickerInfo } from '@/types'

interface Props { info: TickerInfo }

export function AboutSection({ info }: Props) {
  if (!info.longBusinessSummary) return null

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs font-semibold text-muted tracking-wide mb-3">About</p>
      <p className="text-sm text-muted leading-relaxed" style={{ textAlign: 'justify' }}>
        {info.longBusinessSummary}
      </p>
      {info.website && (
        <a
          href={info.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-accent hover:underline"
        >
          {info.website}
        </a>
      )}
    </div>
  )
}
