'use client'

import { MessageCircle } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { getWhatsAppUrl } from '@/lib/utils'
import { trackWhatsAppClick } from '@/lib/api'

export default function WhatsAppButton() {
  const url = getWhatsAppUrl(
    SITE_CONFIG.whatsapp,
    'Hello Zenco Systems, I would like to inquire about your chemical products.'
  )

  return (
    <a
      href={url}
      onClick={() => {
        trackWhatsAppClick({
          page_url: window.location.pathname,
          source: 'floating_button',
          message: 'Hello Zenco Systems, I would like to inquire about your chemical products.',
        }).catch(() => {})
      }}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-200 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={28} className="animate-float" />
      {/* Tooltip */}
      <span className="absolute right-16 scale-0 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl border border-white/10 transition-all duration-200 group-hover:scale-100 whitespace-nowrap">
        Chat with us
      </span>
    </a>
  )
}
