'use client'

import Link from 'next/link'
import { ArrowRight, MessageCircle, PhoneCall } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'
import { whatsappHref } from '@/components/products/product-helpers'

export default function CTABanner() {
  return (
    <section className="section bg-primary relative overflow-hidden pattern-dots">
      {/* Dynamic Background Circle Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="container-lg relative z-10 text-center max-w-4xl mx-auto py-12 px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Ready to Streamline Your Industrial Chemical Supply Chain?
        </h2>
        <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Partner with Zenco Systems for reliable volume supply, tailored chemical blending, and expert technical support across East Africa.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact?type=quote"
            className="btn-primary btn-lg w-full sm:w-auto shadow-glow-accent"
          >
            Request custom Quote
            <ArrowRight size={18} />
          </Link>
          <a
            href={whatsappHref(undefined, 'homepage quote section inquiry')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-lg w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} />
            WhatsApp Quote
          </a>
          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="btn btn-secondary btn-lg w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm flex items-center justify-center gap-2"
          >
            <PhoneCall size={18} className="text-accent" />
            Talk to an Expert
          </a>
        </div>
      </div>
    </section>
  )
}
