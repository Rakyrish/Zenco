'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, ChevronRight, Phone, Mail, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_LINKS, SITE_CONFIG, PRODUCT_CATEGORIES } from '@/lib/constants'
import { getWhatsAppUrl } from '@/lib/utils'
import Logo from '@/components/shared/Logo'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={ref}
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full bg-primary shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-out lg:hidden overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Logo textClassName="text-white" />
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_LINKS.map(link => (
            <div key={link.label}>
              <Link
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all group"
              >
                <span className="font-medium">{link.label}</span>
                <ChevronRight size={16} className="text-white/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          ))}

          {/* Product Categories */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest px-4 mb-3">
              Product Categories
            </p>
            {PRODUCT_CATEGORIES.slice(0, 5).map(cat => (
              <Link
                key={cat.slug}
                href={`/products/category/${cat.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-accent text-sm font-semibold hover:underline"
            >
              View All Products →
            </Link>
          </div>
        </nav>

        {/* Contact Strip */}
        <div className="px-4 py-5 border-t border-white/10 space-y-3">
          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
          >
            <Phone size={16} className="text-accent" />
            {SITE_CONFIG.phone}
          </a>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
          >
            <Mail size={16} className="text-accent" />
            {SITE_CONFIG.email}
          </a>
          <a
            href={getWhatsAppUrl(SITE_CONFIG.whatsapp, 'Hello Zenco Systems, I have an inquiry.')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors w-full"
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
          </a>
          <Link
            href="/contact"
            onClick={onClose}
            className="btn-primary btn w-full text-center"
          >
            Get a Quote
          </Link>
        </div>
      </div>
    </>
  )
}
