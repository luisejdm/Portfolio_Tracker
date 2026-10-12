import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'dark' | 'light'
  accentColor: string
  displayCurrency: 'MXN' | 'USD'
  pieUsesAccentPalette: boolean
  fontSize: number  // px applied to <html>, 12–18, default 14
  setTheme: (theme: 'dark' | 'light') => void
  setAccentColor: (color: string) => void
  setDisplayCurrency: (currency: 'MXN' | 'USD') => void
  setPieUsesAccentPalette: (v: boolean) => void
  setFontSize: (size: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: '#4F89FF',
      displayCurrency: 'MXN',
      pieUsesAccentPalette: true,
      fontSize: 14,
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setPieUsesAccentPalette: (pieUsesAccentPalette) => set({ pieUsesAccentPalette }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    { name: 'portfolio-ui' },
  ),
)
