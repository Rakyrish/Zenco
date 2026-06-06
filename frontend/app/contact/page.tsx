import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'
import { generatePageMetadata, breadcrumbSchema, localBusinessSchema } from '@/lib/metadata'
import ContactPageContent from './ContactPageContent'

export const metadata: Metadata = generatePageMetadata({
  title: `Contact Us | Chemical Division Sourcing & Quotes`,
  description: `Contact ${SITE_CONFIG.fullName} for bulk chemical quotes, product specifications, distribution partnerships, and technical engineering support. Speak directly to our Nairobi depot or call ${SITE_CONFIG.phone}.`,
  path: '/contact',
  keywords: [
    'contact chemical supplier',
    'chemical quote request',
    'Nairobi chemical depot address',
    'bulk chemicals sales Kenya',
    'chemical engineering support contact',
  ],
})

export default function ContactPage() {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
      {/* Local Business Schema on Contact Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema()),
        }}
      />
      <div className="container-xl px-4">
        <Suspense fallback={<div className="text-center py-12 text-zinc-500 text-sm">Loading contact form...</div>}>
          <ContactPageContent />
        </Suspense>
      </div>
    </div>
  )
}
