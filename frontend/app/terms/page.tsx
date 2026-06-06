import Link from 'next/link'
import { generatePageMetadata } from '@/lib/metadata'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata = generatePageMetadata({
  title: 'Terms and Conditions',
  description: `Terms for using ${SITE_CONFIG.fullName} website, catalog, quote requests, and chemical service information.`,
  path: '/terms',
})

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-50 py-12">
      <div className="container-xl px-4">
        <div className="max-w-3xl">
          <p className="section-tag">Terms</p>
          <h1 className="mt-3 text-4xl font-black text-primary md:text-5xl">Terms and Conditions</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            Website content, product availability, and pricing are provided for inquiry and quotation support by {SITE_CONFIG.fullName}.
          </p>
        </div>

        <div className="mt-8 grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-600 shadow-sm">
          <p>Catalog details, service pages, and industry guidance are provided for general commercial information and may change after technical or sales review.</p>
          <p>Quotes, lead times, packaging, delivery, and product recommendations are confirmed by the sales or technical team before supply.</p>
          <p>Customers should follow applicable safety documentation, handling procedures, and regulatory requirements for each product.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/products" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
            Browse Products
          </Link>
          <Link href="/contact?type=quote" className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-black text-primary hover:border-accent">
            Request a Quote
          </Link>
        </div>
      </div>
    </main>
  )
}
