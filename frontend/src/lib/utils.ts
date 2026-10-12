import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'MXN',
): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatPct(
  value: number | string | null | undefined,
  decimals: number = 2,
): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(decimals)}%`
}

export function formatNumber(value: number | string | null | undefined, decimals = 4): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return num.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function pnlColor(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  return num >= 0 ? 'text-green-500' : 'text-red-500'
}

export function detectCurrency(ticker: string): 'MXN' | 'USD' {
  return ticker.toUpperCase().endsWith('.MX') ? 'MXN' : 'USD'
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
      .toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Tailwind-style scale: 9 stops (100→900).
// Absolute lightness values and saturation multipliers mirror how Tailwind
// builds its palettes — same hue, varying L and S so the lightest stop looks
// washed-out and the darkest looks near-black for that hue.
const TW_L    = [93, 85, 75, 63, 52, 42, 33, 25, 17]
const TW_SMUL = [0.18, 0.42, 0.65, 0.85, 1.0, 0.95, 0.85, 0.74, 0.62]
//               100   200  300   400  500  600   700   800   900

export function generateAccentPalette(accentHex: string, count: number): string[] {
  if (count === 0) return []
  if (count === 1) return [accentHex]

  const [h, s] = hexToHsl(accentHex)

  // Pick from stops 200–700 (indices 1–6) to avoid near-white and near-black
  const START = 1, END = 6
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const idx = Math.round(START + t * (END - START))
    return hslToHex(h, Math.min(100, s * TW_SMUL[idx]), TW_L[idx])
  })
}
