import Link from 'next/link'
import { AlertTriangle, Boxes, Factory, Package, Warehouse } from 'lucide-react'
import type { ProductContentSections as Sections, ProductDetail, TitledSection } from '@/types'

function paragraphs(value?: string): string[] {
  return String(value || '')
    .split(/\n{2,}|\n/)
    .map(part => part.trim())
    .filter(Boolean)
}

function titledItems(value: unknown): TitledSection[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is TitledSection => Boolean(item && typeof item === 'object'))
    .map(item => ({
      title: String(item.title || '').trim(),
      description: String(item.description || item.paragraph || '').trim(),
    }))
    .filter(item => item.title && item.description)
}

export function contentSectionsFromSchema(product: ProductDetail): Sections | null {
  const raw = (product.schema_data || {}).content_sections
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const sections = raw as Sections
  const hasContent =
    paragraphs(sections.introduction).length ||
    paragraphs(sections.detailed_overview).length ||
    titledItems(sections.applications_detailed).length ||
    titledItems(sections.benefits_detailed).length
  return hasContent ? sections : null
}

/**
 * Authority-page content sections rendered from AI-generated
 * schema_data.content_sections. Server-renderable; proper H2/H3 hierarchy.
 */
export default function ProductContentSections({ product, sections }: { product: ProductDetail; sections: Sections }) {
  const intro = paragraphs(sections.introduction)
  const overview = paragraphs(sections.detailed_overview)
  const applications = titledItems(sections.applications_detailed)
  const benefits = titledItems(sections.benefits_detailed)
  const packaging = paragraphs(sections.packaging_information)
  const storage = paragraphs(sections.storage_handling)
  const safety = paragraphs(sections.safety_information)
  const categoryHref = `/products/category/${product.category.slug}`

  return (
    <>
      {!!intro.length && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black text-primary">What is {product.name}?</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-8 text-zinc-600">
            {intro.map((text, index) => <p key={index}>{text}</p>)}
          </div>
        </section>
      )}

      {!!overview.length && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black text-primary">{product.name}: Detailed Product Overview</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-8 text-zinc-600">
            {overview.map((text, index) => <p key={index}>{text}</p>)}
          </div>
        </section>
      )}

      {!!applications.length && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <Factory className="text-accent" size={22} />
            <h2 className="text-2xl font-black text-primary">Applications and Uses of {product.name}</h2>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {applications.map(app => (
              <article key={app.title} className="rounded-md border border-zinc-100 bg-zinc-50/60 p-5">
                <h3 className="text-base font-extrabold text-primary">{app.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{app.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-zinc-500">
            Looking for alternatives for a specific process? Browse the full{' '}
            <Link href={categoryHref} className="font-bold text-accent hover:text-primary">{product.category.name}</Link>{' '}
            range or <Link href={`/contact?type=product&product=${encodeURIComponent(product.name)}`} className="font-bold text-accent hover:text-primary">ask our technical team</Link>{' '}
            which grade fits your application.
          </p>
        </section>
      )}

      {!!benefits.length && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-black text-primary">Benefits and Advantages</h2>
          <div className="mt-5 space-y-6">
            {benefits.map(benefit => (
              <div key={benefit.title}>
                <h3 className="text-base font-extrabold text-primary">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!!packaging.length && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <Package className="text-accent" size={22} />
            <h2 className="text-2xl font-black text-primary">Packaging Information</h2>
          </div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600">
            {packaging.map((text, index) => <p key={index}>{text}</p>)}
          </div>
          {product.packaging && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 text-xs font-bold text-primary">
              <Boxes size={14} className="text-accent" /> Standard formats: {product.packaging}
            </p>
          )}
        </section>
      )}

      {!!storage.length && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <Warehouse className="text-accent" size={22} />
            <h2 className="text-2xl font-black text-primary">Storage and Handling</h2>
          </div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600">
            {storage.map((text, index) => <p key={index}>{text}</p>)}
          </div>
        </section>
      )}

      {!!safety.length && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-700" size={22} />
            <h2 className="text-2xl font-black text-amber-900">Safety Information</h2>
          </div>
          <div className="mt-4 space-y-4 text-sm leading-7 text-amber-900">
            {safety.map((text, index) => <p key={index}>{text}</p>)}
          </div>
          {product.product_data_sheet?.status === 'published' && (
            <p className="mt-4 text-sm font-bold text-amber-900">
              Full hazard detail is available in the{' '}
              <Link href={`/products/${product.slug}/datasheet`} className="underline hover:text-amber-700">
                technical data sheet
              </Link>.
            </p>
          )}
        </section>
      )}
    </>
  )
}
