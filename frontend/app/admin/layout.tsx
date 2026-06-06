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
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1c] flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F26C0C] animate-pulse" />
          <p className="text-sm text-gray-500 dark:text-[#94a3b8]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] dark:bg-[#0a0f1c] dark:text-[#f8fafc] flex transition-colors duration-300">
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
