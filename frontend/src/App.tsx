import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { SettingsPanel } from '@/components/layout/SettingsPanel'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Explorer } from '@/pages/Explorer'
import { useUIStore } from '@/store/uiStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, accentColor, fontSize } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return <>{children}</>
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <div className="min-h-screen bg-bg">
            <TopNav onSettingsOpen={() => setSettingsOpen(true)} />
            <main className="max-w-[1400px] mx-auto px-6 py-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/explorer" element={<Explorer />} />
              </Routes>
            </main>
            <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
          </div>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
