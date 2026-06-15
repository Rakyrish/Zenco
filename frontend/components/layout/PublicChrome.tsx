'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ChatbotWidget from '@/components/shared/ChatbotWidget'

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
    )
  }

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
      <ChatbotWidget />
    </>
  )
}
