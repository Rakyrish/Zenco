import Link from 'next/link'
import { generatePageMetadata } from '@/lib/metadata'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata = generatePageMetadata({
  title: 'Privacy Policy',
  description: `Privacy information for customers contacting ${SITE_CONFIG.fullName} about chemical products, quotes, and services.`,
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-12">
      <div className="container-xl px-4">
        <div className="max-w-3xl">
          <p className="section-tag">Policy</p>
          <h1 className="mt-3 text-4xl font-black text-primary md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            {SITE_CONFIG.fullName} uses customer details to respond to inquiries, prepare quotations, coordinate product support, and improve website service.
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-600 shadow-sm">
          <p>Information submitted through contact, quote, search, chatbot, or WhatsApp links may include names, company details, contact details, inquiry notes, and product requirements.</p>
          <p>We use this information for sales follow-up, technical support, delivery coordination, customer service, and lawful business communication.</p>
          <p>We do not use this page as a dead end. For questions about your information, contact our team directly.</p>
        </div>

        <Link href="/contact" className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
          Contact Us
        </Link>
      </div>
    </main>
  )
}
