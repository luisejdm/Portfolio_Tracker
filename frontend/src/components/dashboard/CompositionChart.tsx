import Plot from 'react-plotly.js'
import { useComposition } from '@/hooks/usePortfolio'
import { useUIStore } from '@/store/uiStore'
import { Skeleton } from '@/components/ui/skeleton'
import { generateAccentPalette } from '@/lib/utils'

export function CompositionChart() {
  const { data, isLoading } = useComposition()
  const { theme, accentColor, pieUsesAccentPalette } = useUIStore()

  if (isLoading) return <Skeleton className="h-72 rounded-xl" />
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl h-72 flex items-center justify-center text-muted text-sm">
        No positions yet
      </div>
    )
  }

  const isDark = theme === 'dark'
  const fontColor = isDark ? '#F0F0F5' : '#111827'
  const gridColor = isDark ? '#1E1E2E' : '#E5E7EB'

  const MULTI_COLOR = [accentColor, '#22C55E', '#F59E0B', '#EC4899', '#A855F7', '#14B8A6', '#F97316', '#06B6D4']
  const sliceColors = pieUsesAccentPalette
    ? generateAccentPalette(accentColor, data.length)
    : data.map((_, i) => MULTI_COLOR[i % MULTI_COLOR.length])

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-sm font-medium text-primary mb-1">Composition</p>
      <Plot
        data={[
          {
            type: 'pie',
            hole: 0.45,
            labels: data.map(d => d.ticker),
            values: data.map(d => parseFloat(d.value)),
            customdata: data.map(d => d.currency),
            hovertemplate: '<b>%{label}</b><br>Value: %{value:,.2f} %{customdata}<br>%{percent}<extra></extra>',
            textinfo: 'label+percent',
            textposition: 'outside',
            textfont: { color: fontColor, size: 11 },
            automargin: true,
            showlegend: false,
            marker: {
              colors: sliceColors,
              line: { color: gridColor, width: 1 },
            },
          },
        ]}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'SF Pro Display, -apple-system, sans-serif', color: fontColor },
          margin: { t: 24, b: 24, l: 24, r: 24 },
          showlegend: false,
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '340px' }}
      />
    </div>
  )
}
