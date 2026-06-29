import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductDataSheetViewer from '@/components/datasheets/ProductDataSheetViewer'
import { getProductDataSheet, trackDatasheetView } from '@/lib/api'
import { breadcrumbSchema, generatePageMetadata } from '@/lib/metadata'
import { SITE_CONFIG } from '@/lib/constants'

export const revalidate = 7200

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const datasheet = await getProductDataSheet(slug)
    return generatePageMetadata({
      title: datasheet.meta_title || `Technical Data Sheet — ${datasheet.product.name}`,
      description: datasheet.meta_description || datasheet.product.short_description,
      path: `/products/${slug}/datasheet`,
      image: datasheet.product.image || undefined,
      type: 'article',
      modifiedTime: datasheet.updated_at,
    })
  } catch {
    return generatePageMetadata({
      title: 'Technical Data Sheet',
      description: SITE_CONFIG.description,
      path: `/products/${slug}/datasheet`,
      noIndex: true,
    })
  }
}

export default async function ProductDatasheetPage({ params }: PageProps) {
  const { slug } = await params

  let datasheet
  try {
    datasheet = await getProductDataSheet(slug)
  } catch {
    notFound()
  }

  trackDatasheetView(slug).catch(() => {})

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: datasheet.product.name, href: `/products/${slug}` },
    { name: 'Technical Data Sheet', href: `/products/${slug}/datasheet` },
  ]

  const techArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: datasheet.title,
    description: datasheet.meta_description,
    about: {
      '@type': 'ChemicalSubstance',
      name: datasheet.product.name,
      description: datasheet.product_description.replace(/<[^>]+>/g, '').slice(0, 500),
      potentialAction: {
        '@type': 'UseAction',
        target: datasheet.applications,
      },
    },
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: { '@type': 'ImageObject', url: `${SITE_CONFIG.url}/og-image.png` },
    },
    version: datasheet.version,
    datePublished: datasheet.issue_date,
    dateModified: datasheet.revision_date,
    proficiencyLevel: 'Expert',
    inLanguage: 'en-KE',
  }

  const breadcrumbLd = breadcrumbSchema(breadcrumbs)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="border-b border-zinc-200 bg-zinc-50">
        <div className="container-xl flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-zinc-600">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-400">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-primary">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-accent">{crumb.name}</Link>
                )}
              </span>
            ))}
          </nav>
          <div className="flex gap-2">
            <Link href={`/contact?type=quote&product=${encodeURIComponent(datasheet.product.name)}`} className="rounded-md bg-accent px-4 py-2 text-xs font-extrabold text-white hover:bg-orange-600">
              Request Quote
            </Link>
            <Link href="/contact" className="rounded-md border border-primary/20 px-4 py-2 text-xs font-extrabold text-primary hover:bg-primary hover:text-white">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <main className="container-xl px-4 py-10">
        <ProductDataSheetViewer datasheet={datasheet} />
      </main>
    </>
  )
}
