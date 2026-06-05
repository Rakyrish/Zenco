import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'
import { SERVICE_PAGES, serviceBySlug } from '@/lib/navigation-content'
import { SITE_CONFIG } from '@/lib/constants'
import { breadcrumbSchema, generatePageMetadata } from '@/lib/metadata'
import { whatsappHref } from '@/components/products/product-helpers'

type ServiceDetailProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return SERVICE_PAGES.map(service => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: ServiceDetailProps): Promise<Metadata> {
  const { slug } = await params
  const service = serviceBySlug(slug)

  if (!service) {
    return generatePageMetadata({
      title: 'Service Support',
      description: SITE_CONFIG.description,
      path: '/services',
    })
  }

  return generatePageMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${service.slug}`,
    keywords: [service.title, service.relatedProductSearch, SITE_CONFIG.serviceArea],
  })
}

export default async function ServiceDetailPage({ params }: ServiceDetailProps) {
  const { slug } = await params
  const service = serviceBySlug(slug)

  if (!service) {
    return (
      <main className="min-h-screen bg-zinc-50 py-16">
        <div className="container-xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">Service Guidance</p>
          <h1 className="mt-3 text-3xl font-black text-primary">Service Not Listed</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
            This service page is not available, but our team can still help with product selection, quotation support, and technical guidance.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/services" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
              Browse Services
            </Link>
            <Link href="/contact?type=technical" className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-black text-primary hover:border-accent">
              Contact Technical Team
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: service.title, href: `/services/${service.slug}` },
  ]

  return (
    <main className="min-h-screen bg-zinc-50 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }} />

      <section className="border-b border-zinc-200 bg-white">
        <div className="container-xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-accent">Services</Link>
            <span>/</span>
            <span className="text-primary">{service.title}</span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-accent">Service Detail</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-primary md:text-6xl">{service.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">{service.tagline}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={`/contact?type=technical&service=${encodeURIComponent(service.title)}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-600">
              Request Technical Help
              <ArrowRight size={16} />
            </Link>
            <a href={whatsappHref(service.title, 'service detail inquiry')} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-green-600 px-5 text-sm font-black text-white hover:bg-green-700">
              <MessageCircle size={17} />
              WhatsApp Sales
            </a>
          </div>
        </div>
      </section>

      <section className="container-xl grid gap-6 px-4 py-10 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-primary">How We Help</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-600">{service.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {service.features.map(feature => (
              <div key={feature} className="flex items-start gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-4">
                <CheckCircle size={17} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-sm font-semibold leading-relaxed text-primary">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-primary">Related Catalog</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">
            Review products related to {service.relatedProductSearch}, or send the service brief to our team for quotation guidance.
          </p>
          <div className="mt-5 space-y-3">
            <Link href={`/products?search=${encodeURIComponent(service.relatedProductSearch)}`} className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent">
              Search Related Products
              <ArrowRight size={15} />
            </Link>
            <Link href="/products" className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent">
              Browse Full Catalog
              <ArrowRight size={15} />
            </Link>
            <Link href="/industries" className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm font-black text-primary hover:border-accent hover:text-accent">
              View Industries
              <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}
