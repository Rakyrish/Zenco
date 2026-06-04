'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getAdminUser, setAdminUser, userFromToken, getAdminToken } from '@/lib/admin/auth'
import { useToast } from '@/lib/admin/hooks'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminTopbar from '@/components/admin/layout/AdminTopbar'
import ToastContainer from '@/components/admin/ui/Toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const { toasts, dismiss } = useToast()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    setHydrated(true)
    if (isLoginPage) return

    if (!isAuthenticated()) {
      router.push('/admin/login')
      return
    }

    // Populate user cache if empty
    if (!getAdminUser()) {
      const token = getAdminToken()
      const user = token ? userFromToken(token) : null
      if (user) setAdminUser(user)
    }
  }, [pathname, isLoginPage, router])

  // Login page gets no shell
  if (isLoginPage) return <>{children}</>

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F26C0C] animate-pulse" />
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
