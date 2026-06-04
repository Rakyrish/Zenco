'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Mail, MessageCircle, Phone, Send, ShieldCheck } from 'lucide-react'
import type { ProductDetail } from '@/types'
import { AVAILABILITY_LABELS, SITE_CONFIG } from '@/lib/constants'
import ProductCard from './ProductCard'
import ProductGallery from './ProductGallery'
import { isOutOfStock, whatsappHref } from './product-helpers'
import { getProducts } from '@/lib/api'

function listFromSchema(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function faqsFromSchema(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map(item => {
      if (typeof item === 'string') return { question: item, answer: 'Contact Zenco Chemicals Ltd sales for product handling, packaging, and availability guidance.' }
      if (item && typeof item === 'object') {
        const data = item as Record<string, unknown>
        return { question: String(data.question || ''), answer: String(data.answer || '') }
      }
      return null
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item?.question && item.answer))
}

export default function ProductDetailExperience({ product }: { product: ProductDetail }) {
  const [recentProducts, setRecentProducts] = useState<ProductDetail['related_products']>([])
  const [featuredProducts, setFeaturedProducts] = useState<ProductDetail['related_products']>([])
  const schema = product.schema_data || {}
  const label = AVAILABILITY_LABELS[product.availability] || AVAILABILITY_LABELS.in_stock
  const unavailable = isOutOfStock(product)
  const benefits = listFromSchema(schema.benefits)
  const features = listFromSchema(schema.features)
  const industries = listFromSchema(schema.industries_served)
  const safety = listFromSchema(schema.safety_considerations)
  const links = listFromSchema(schema.internal_linking_suggestions)
  const faqs = faqsFromSchema(schema.faq_section)
  const whatsappProduct = {
    name: product.name,
    slug: product.slug,
    category_name: product.category?.name || product.category_name,
  }

  useEffect(() => {
    async function loadRelatedCatalogs() {
      try {
        const [recent, featured] = await Promise.all([
          getProducts({ ordering: '-created_at', page: 1 }),
          getProducts({ featured: true, page: 1 }),
        ])
        setRecentProducts(recent.results.filter(item => item.slug !== product.slug).slice(0, 4))
        setFeaturedProducts(featured.results.filter(item => item.slug !== product.slug).slice(0, 4))
      } catch {
        setRecentProducts([])
        setFeaturedProducts([])
      }
    }
    loadRelatedCatalogs()
  }, [product.slug])

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <section className="border-b border-zinc-200 bg-white">
        <div className="container-xl px-4 py-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-accent">Products</Link>
            <span>/</span>
            <Link href={`/products/category/${product.category.slug}`} className="hover:text-accent">{product.category.name}</Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <ProductGallery product={product} />

            <div className="flex flex-col justify-center">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link href={`/products/category/${product.category.slug}`} className="rounded bg-accent/10 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-accent">
                  {product.category.name}
                </Link>
                <span className={`rounded px-3 py-1 text-xs font-bold ${unavailable ? AVAILABILITY_LABELS.out_of_stock.color : label.color}`}>
                  {unavailable ? 'Out of Stock' : label.label}
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight text-primary md:text-5xl">{product.name}</h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-zinc-600">{product.short_description}</p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600">{product.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <a href={whatsappHref(whatsappProduct, 'product detail hero inquiry')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-green-600 px-4 text-sm font-extrabold text-white hover:bg-green-700">
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
                <Link href={`/contact?type=quote&product=${encodeURIComponent(product.name)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-extrabold text-white hover:bg-orange-600">
                  <Send size={18} />
                  Request Quote
                </Link>
                <Link href="/contact?type=product" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-primary/20 bg-white px-4 text-sm font-extrabold text-primary hover:bg-primary hover:text-white">
                  Contact Sales
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                {SITE_CONFIG.phone && <a href={`tel:${SITE_CONFIG.phone}`} className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-white px-3 py-2"><Phone size={14} /> {SITE_CONFIG.phone}</a>}
                {SITE_CONFIG.email && <a href={`mailto:${SITE_CONFIG.email}`} className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-white px-3 py-2"><Mail size={14} /> Email Sales</a>}
                {product.datasheet && <a href={product.datasheet} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-white px-3 py-2"><Download size={14} /> Datasheet</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container-xl space-y-10 px-4 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['Packaging', product.packaging || 'Confirm with sales'],
            ['Supply Region', product.regions_available.join(', ') || 'East Africa'],
            ['Supplier', 'Zenco Chemicals Ltd'],
          ].map(([labelText, value]) => (
            <div key={labelText} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">{labelText}</p>
              <p className="mt-2 text-sm font-bold leading-relaxed text-primary">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-primary">Technical Specifications</h2>
            <div className="mt-5 divide-y divide-zinc-100">
              {Object.keys(product.specifications || {}).length ? Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[0.9fr_1.1fr] gap-4 py-3 text-sm">
                  <span className="font-semibold text-zinc-500">{key}</span>
                  <span className="font-bold text-primary">{value}</span>
                </div>
              )) : <p className="text-sm text-zinc-500">Technical specifications are available on request.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-primary">Applications</h2>
            <ul className="mt-5 space-y-3">
              {(product.applications || []).map(item => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-600">
                  <ShieldCheck className="mt-0.5 shrink-0 text-accent" size={17} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {(benefits.length || features.length || industries.length) && (
          <section className="grid gap-6 md:grid-cols-3">
            {[
              ['Benefits', benefits],
              ['Product Features', features],
              ['Industries Served', industries],
            ].map(([title, items]) => (
              <div key={title as string} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-primary">{title as string}</h2>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-600">
                  {(items as string[]).slice(0, 8).map(item => <li key={item}>- {item}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-primary">Product Overview</h2>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            {product.name} is supplied by Zenco Chemicals Ltd for industrial buyers, distributors, laboratories, manufacturers, and procurement teams across Kenya and East Africa. Zenco Chemicals Ltd supports quotation requests, packaging confirmation, product availability checks, and regional supply coordination for this product category.
          </p>
          {!!links.length && (
            <div className="mt-5 flex flex-wrap gap-2">
              {links.slice(0, 8).map(link => <span key={link} className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600">{link}</span>)}
            </div>
          )}
        </section>

        {!!faqs.length && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-primary">Product FAQ</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {faqs.slice(0, 6).map(faq => (
                <details key={faq.question} className="rounded-md border border-zinc-200 p-4">
                  <summary className="cursor-pointer text-sm font-bold text-primary">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {!!safety.length && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-black text-amber-900">Safety Considerations</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-amber-800">
              {safety.map(item => <li key={item}>- {item}</li>)}
            </ul>
          </section>
        )}

        {!!product.related_products.length && (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-primary">Related Products</h2>
                <p className="mt-1 text-sm text-zinc-500">More chemicals in {product.category.name}</p>
              </div>
              <Link href={`/products/category/${product.category.slug}`} className="text-sm font-bold text-accent hover:text-primary">View category</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {product.related_products.map(item => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}

        {!!recentProducts.length && (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-primary">Recently Added Products</h2>
                <p className="mt-1 text-sm text-zinc-500">Fresh catalog entries for procurement review.</p>
              </div>
              <Link href="/products?sort=-created_at" className="text-sm font-bold text-accent hover:text-primary">View newest</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {recentProducts.map(item => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}

        {!!featuredProducts.length && (
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-primary">Featured Products</h2>
                <p className="mt-1 text-sm text-zinc-500">High-priority products from the Zenco Chemicals Ltd catalog.</p>
              </div>
              <Link href="/products" className="text-sm font-bold text-accent hover:text-primary">Browse catalog</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {featuredProducts.map(item => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 p-3 shadow-2xl backdrop-blur md:hidden">
        <a href={whatsappHref(whatsappProduct, 'mobile sticky product inquiry')} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-md bg-green-600 text-sm font-black text-white">
          <MessageCircle size={18} />
          Inquire on WhatsApp
        </a>
      </div>
    </div>
  )
}
