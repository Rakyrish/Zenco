import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle, Phone } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { getCategories, getCategoryBySlug, getProducts } from '@/lib/api'
import { breadcrumbSchema, faqSchema, generatePageMetadata } from '@/lib/metadata'
import { SITE_CONFIG } from '@/lib/constants'
import { whatsappHref } from '@/components/products/product-helpers'

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const category = await getCategoryBySlug(slug)
    return generatePageMetadata({
      title: category.seo_title || `${category.name} Chemicals`,
      description: category.seo_description || category.description || `${category.name} chemicals supplied by Zenco Chemicals Ltd across Kenya and East Africa.`,
      path: `/products/category/${category.slug}`,
      image: category.image || undefined,
      keywords: [category.name, `${category.name} Kenya`, `${category.name} supplier East Africa`],
    })
  } catch {
    return generatePageMetadata({ title: 'Chemical Categories', description: SITE_CONFIG.description, path: '/products' })
  }
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories()
    return categories.map(category => ({ slug: category.slug }))
  } catch {
    return []
  }
}

export default async function CategoryCatalogPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [category, products, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getProducts({ category: slug, page: 1 }),
    getCategories(),
  ])
  const relatedCategories = categories.filter(item => item.slug !== category.slug).slice(0, 6)
  const faqs = [
    {
      question: `Does Zenco Chemicals Ltd supply ${category.name} in East Africa?`,
      answer: `Yes. Zenco Chemicals Ltd supplies ${category.name} products for buyers in Kenya and wider East Africa, subject to stock, packaging, and delivery confirmation.`,
    },
    {
      question: `Can I request a quotation for ${category.name}?`,
      answer: 'Yes. Use the quote or WhatsApp inquiry buttons on any product page and include quantity, location, and packaging preference.',
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([
        { name: 'Home', href: '/' },
        { name: 'Products', href: '/products' },
        { name: category.name, href: `/products/category/${category.slug}` },
      ])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />

      <section className="border-b border-zinc-200 bg-white">
        <div className="container-xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-accent">Products</Link>
            <span>/</span>
            <span className="text-primary">{category.name}</span>
          </div>
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-accent">Category catalog</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-primary md:text-6xl">{category.name}</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600 md:text-base">
              {category.description || `${category.name} products supplied by Zenco Chemicals Ltd for procurement teams, distributors, laboratories, and industrial buyers.`}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref(`${category.name} products`, 'category page inquiry')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-green-600 px-5 text-sm font-black text-white hover:bg-green-700"
              >
                <MessageCircle size={18} />
                WhatsApp Category Inquiry
              </a>
              {SITE_CONFIG.phone && (
                <a href={`tel:${SITE_CONFIG.phone}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-primary/20 bg-white px-5 text-sm font-black text-primary hover:bg-primary hover:text-white">
                  <Phone size={18} />
                  Call Sales
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="container-xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-primary">Products in {category.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">{products.count} catalog items available for review</p>
          </div>
          <Link href={`/products?category=${category.slug}`} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-primary hover:border-accent">
            Filter full catalog
          </Link>
        </div>

        {products.results.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {products.results.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center">
            <p className="text-lg font-black text-primary">No published products in this category yet.</p>
            <Link href="/contact?type=product" className="mt-5 inline-flex rounded-md bg-accent px-5 py-3 text-sm font-black text-white">Contact Sales</Link>
          </div>
        )}

        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-primary">{category.name} Supply Information</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              Zenco Chemicals Ltd supplies {category.name} products for industrial buyers across Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, Ethiopia, Somalia, and the Democratic Republic of the Congo. Product availability, packaging, transport, and documentation are confirmed by the sales team before dispatch.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-primary">FAQ</h2>
            <div className="mt-4 space-y-3">
              {faqs.map(faq => (
                <details key={faq.question} className="rounded-md border border-zinc-200 p-4">
                  <summary className="cursor-pointer text-sm font-bold text-primary">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {!!relatedCategories.length && (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-primary">Related Categories</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCategories.map(item => (
                <Link key={item.slug} href={`/products/category/${item.slug}`} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm hover:border-accent">
                  <h3 className="text-lg font-black text-primary">{item.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{item.description || `View ${item.name} chemicals.`}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
