'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Menu, Bell, Sun, Moon, LogOut, User, ChevronDown,
  Settings, ExternalLink, Search,
} from 'lucide-react'
import { clearAdminTokens, getAdminUser } from '@/lib/admin/auth'

// Breadcrumb map
const LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  products: 'Products',
  new: 'New',
  edit: 'Edit',
  blog: 'Blog',
  inquiries: 'Inquiries',
  quotes: 'Quote Requests',
  chatbot: 'Chatbot Monitor',
  inventory: 'Inventory',
  analytics: 'Analytics',
  seo: 'SEO Manager',
  users: 'Users',
  settings: 'Settings',
}

function useBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: LABELS[part] || part,
    href: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }))
}

interface AdminTopbarProps {
  onMenuClick: () => void
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const breadcrumbs = useBreadcrumbs()
  const user = getAdminUser()

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored || (systemDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', initial === 'dark')
    document.documentElement.style.colorScheme = initial
    setTheme(initial)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
    localStorage.setItem('theme', next)
  }

  const handleLogout = () => {
    clearAdminTokens()
    router.push('/admin/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30">

      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0 flex-1">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
            {crumb.isLast ? (
              <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 truncate transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Search shortcut */}
        <button className="hidden md:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors">
          <Search size={13} />
          <span>Quick search…</span>
          <span className="font-mono bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1 rounded text-[10px]">⌘K</span>
        </button>

        {/* View site */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ExternalLink size={14} />
          <span>View Site</span>
        </Link>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0C094D] dark:bg-[#F26C0C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                {user?.full_name || 'Administrator'}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role || 'admin'}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.full_name || 'Administrator'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@zencosystems.co.ke'}</p>
                </div>
                <div className="py-1">
                  <Link href="/admin/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Settings size={14} className="text-gray-400" /> Settings
                  </Link>
                  <Link href="/admin/users" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <User size={14} className="text-gray-400" /> Profile
                  </Link>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
