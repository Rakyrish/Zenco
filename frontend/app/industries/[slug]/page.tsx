import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'
import { INDUSTRY_PAGES, industryBySlug } from '@/lib/navigation-content'
import { SITE_CONFIG } from '@/lib/constants'
import { breadcrumbSchema, generatePageMetadata } from '@/lib/metadata'
import { whatsappHref } from '@/components/products/product-helpers'

type IndustryDetailProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return INDUSTRY_PAGES.map(industry => ({ slug: industry.slug }))
}

export async function generateMetadata({ params }: IndustryDetailProps): Promise<Metadata> {
  const { slug } = await params
  const industry = industryBySlug(slug)

  if (!industry) {
    return generatePageMetadata({
      title: 'Industry Support',
      description: SITE_CONFIG.description,
      path: '/industries',
    })
  }

  return generatePageMetadata({
    title: industry.title,
    description: industry.description,
    path: `/industries/${industry.slug}`,
    keywords: [industry.title, industry.relatedProductSearch, SITE_CONFIG.serviceArea],
  })
}

export default async function IndustryDetailPage({ params }: IndustryDetailProps) {
  const { slug } = await params
  const industry = industryBySlug(slug)

  if (!industry) {
    return (
      <main className="min-h-screen bg-zinc-50 py-16">
        <div className="container-xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">Industry Guidance</p>
          <h1 className="mt-3 text-3xl font-black text-primary">Industry Not Listed</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
            This industry page is not available, but our team can still recommend products, services, and quotation support for your operation.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/industries" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
              Browse Industries
            </Link>
            <Link href="/contact?type=quote" className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-black text-primary hover:border-accent">
              Request Guidance
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Industries', href: '/industries' },
    { name: industry.title, href: `/industries/${industry.slug}` },
  ]

  return (
    <main className="min-h-screen bg-zinc-50 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }} />

      <section className="border-b border-zinc-200 bg-white">
        <div className="container-xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link href="/industries" className="hover:text-accent">Industries</Link>
            <span>/</span>
            <span className="text-primary">{industry.title}</span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-accent">Industry Detail</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-primary md:text-6xl">{industry.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">{industry.tagline}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={`/contact?type=quote&industry=${encodeURIComponent(industry.title)}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
              Request Industry Quote
              <ArrowRight size={16} />
            </Link>
            <a href={whatsappHref(industry.title, 'industry detail inquiry')} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-green-600 px-5 text-sm font-black text-white hover:bg-green-700">
              <MessageCircle size={17} />
              WhatsApp Sales
            </a>
          </div>
        </div>
      </section>

      <section className="container-xl grid gap-6 px-4 py-10 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-primary">Relevant Solutions</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-600">{industry.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {industry.solutions.map(solution => (
              <div key={solution} className="flex items-start gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-4">
                <CheckCircle size={17} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-sm font-semibold leading-relaxed text-primary">{solution}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-primary">Related Navigation</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">
            Explore products and services related to {industry.relatedProductSearch}, or send the requirement directly to sales.
          </p>
          <div className="mt-5 space-y-3">
            <Link href={`/products?search=${encodeURIComponent(industry.relatedProductSearch)}`} className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent">
              Search Related Products
              <ArrowRight size={15} />
            </Link>
            <Link href="/services" className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent">
              View Services
              <ArrowRight size={15} />
            </Link>
            <Link href="/contact?type=technical" className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent">
              Ask Technical Team
              <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}
