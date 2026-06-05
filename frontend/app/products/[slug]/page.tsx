import type { Metadata } from 'next'
import Link from 'next/link'
import ProductDetailExperience from '@/components/products/ProductDetailExperience'
import { getProductBySlug, getProducts } from '@/lib/api'
import { breadcrumbSchema, faqSchema, generatePageMetadata, productSchema } from '@/lib/metadata'
import { SITE_CONFIG } from '@/lib/constants'

type ProductPageProps = {
  params: Promise<{ slug: string }>
}

function faqsFromSchema(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map(item => {
      if (typeof item === 'string') return { question: item, answer: `Contact ${SITE_CONFIG.name} for product supply details.` }
      if (item && typeof item === 'object') {
        const data = item as Record<string, unknown>
        return { question: String(data.question || ''), answer: String(data.answer || '') }
      }
      return null
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item?.question && item.answer))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const product = await getProductBySlug(slug)
    const keywords = [
      product.name,
      product.category.name,
      `${product.name} supplier ${SITE_CONFIG.address.country}`,
      `${product.name} ${SITE_CONFIG.serviceArea}`,
      ...((product.schema_data?.seo_keywords as string[] | undefined) || []),
    ]
    return generatePageMetadata({
      title: product.seo_title || `${product.name} Supplier`,
      description: product.seo_description || product.short_description,
      path: `/products/${product.slug}`,
      image: product.image || undefined,
      type: 'product',
      modifiedTime: product.updated_at,
      keywords,
    })
  } catch {
    return generatePageMetadata({
      title: 'Product Catalog',
      description: SITE_CONFIG.description,
      path: '/products',
    })
  }
}

export async function generateStaticParams() {
  try {
    const products = await getProducts({ page: 1 })
    return products.results.map(product => ({ slug: product.slug }))
  } catch {
    return []
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params

  try {
    const product = await getProductBySlug(slug)
    const faqs = faqsFromSchema(product.schema_data?.faq_section)
    const breadcrumbs = [
      { name: 'Home', href: '/' },
      { name: 'Products', href: '/products' },
      { name: product.category.name, href: `/products/category/${product.category.slug}` },
      { name: product.name, href: `/products/${product.slug}` },
    ]

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema({
              name: product.name,
              description: product.short_description,
              image: product.image || undefined,
              slug: product.slug,
              availability: product.availability,
            })),
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }} />
        {!!faqs.length && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />}
        <ProductDetailExperience product={product} />
      </>
    )
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
        <h1 className="text-2xl font-black text-primary">Product Not Found</h1>
        <p className="mb-6 mt-2 max-w-md text-sm text-zinc-500">The product you are looking for does not exist or is not currently published.</p>
        <Link href="/products" className="btn-primary">Back to Catalog</Link>
      </div>
    )
  }
}
