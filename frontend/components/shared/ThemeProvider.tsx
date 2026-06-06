'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  mounted: boolean
}

const STORAGE_KEY = 'theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'dark' || value === 'light' ? value : null
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeState, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  const setTheme = useCallback((theme: Theme) => {
    setThemeState(theme)
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(themeState === 'dark' ? 'light' : 'dark')
  }, [setTheme, themeState])

  useEffect(() => {
    const initial = storedTheme() || systemTheme()
    setThemeState(initial)
    applyTheme(initial)
    setMounted(true)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (storedTheme()) return
      const next = media.matches ? 'dark' : 'light'
      setThemeState(next)
      applyTheme(next)
    }

    media.addEventListener('change', handleSystemChange)
    return () => media.removeEventListener('change', handleSystemChange)
  }, [])

  const value = useMemo(
    () => ({ theme: themeState, setTheme, toggleTheme, mounted }),
    [mounted, setTheme, themeState, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
}
