'use client'

import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  variant?: 'public' | 'admin'
}

export default function ThemeToggle({ variant = 'public' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme()
  const isDark = mounted && theme === 'dark'

  const classes = {
    public: 'text-white/75 hover:text-white hover:bg-white/10 focus-visible:ring-white/40',
    admin: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10 focus-visible:ring-[#F26C0C]/50',
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'hover:scale-105 active:scale-95',
        classes[variant],
      )}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0" />
      ) : (
        <Moon size={18} className="transition-transform duration-300" />
      )}
    </button>
  )
}
