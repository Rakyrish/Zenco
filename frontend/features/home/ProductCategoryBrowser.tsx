'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import type { Category, ProductListItem } from '@/types'

export type CategoryShelf = {
  category: Category
  products: ProductListItem[]
  total: number
}

interface ProductCategoryBrowserProps {
  shelves: CategoryShelf[]
}

export default function ProductCategoryBrowser({ shelves }: ProductCategoryBrowserProps) {
  const [activeSlug, setActiveSlug] = useState(shelves[0]?.category.slug || '')
  const activeShelf = useMemo(
    () => shelves.find(shelf => shelf.category.slug === activeSlug) || shelves[0],
    [activeSlug, shelves],
  )

  if (!shelves.length || !activeShelf) return null

  return (
    <div className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">Category Navigation Tabs</p>
          <h2 className="mt-1 text-2xl font-black text-primary">Browse by Category</h2>
        </div>
        <Link href="/products" className="hidden text-sm font-bold text-accent hover:text-primary sm:inline-flex">
          Full catalog
        </Link>
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm lg:grid lg:grid-cols-[260px_1fr]">
        <nav className="border-r border-zinc-200 bg-zinc-50 p-3" aria-label="Featured product categories">
          {shelves.map(({ category }, index) => {
            const active = category.slug === activeShelf.category.slug
            return (
              <Link
                key={category.id}
                href={`/products/category/${category.slug}`}
                onMouseEnter={() => setActiveSlug(category.slug)}
                onFocus={() => setActiveSlug(category.slug)}
                onClick={event => event.preventDefault()}
                className={`flex min-h-12 items-center justify-between gap-3 rounded-md px-3 text-sm font-black transition ${
                  active ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-white hover:text-accent'
                }`}
              >
                <span className="line-clamp-1">{category.name}</span>
                {index >= 5 ? <ChevronDown size={15} /> : <ArrowRight size={15} />}
              </Link>
            )
          })}
        </nav>

        <section className="p-5" aria-live="polite">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-primary">{activeShelf.category.name}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-500">
                {activeShelf.category.description || `Latest ${activeShelf.category.name} products supplied by Zenco Chemicals Ltd.`}
              </p>
            </div>
            {activeShelf.total > activeShelf.products.length && (
              <Link href={`/products/category/${activeShelf.category.slug}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-white hover:bg-primary-600">
                View All Products
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4 transition-opacity duration-200">
            {activeShelf.products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-3 lg:hidden">
        {shelves.map(({ category, products, total }, shelfIndex) => {
          const expanded = category.slug === activeShelf.category.slug
          return (
            <section key={category.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setActiveSlug(category.slug)}
                className="flex min-h-14 w-full items-center justify-between gap-4 px-4 text-left text-base font-black text-primary"
                aria-expanded={expanded}
              >
                <span>{category.name}</span>
                <ChevronDown size={18} className={`shrink-0 transition ${expanded ? 'rotate-180 text-accent' : ''}`} />
              </button>
              {expanded && (
                <div className="border-t border-zinc-200 p-4">
                  <h2 className="sr-only">{category.name}</h2>
                  <p className="mb-4 text-sm leading-relaxed text-zinc-500">
                    {category.description || `Latest ${category.name} products supplied by Zenco Chemicals Ltd.`}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {products.map((product, productIndex) => (
                      <ProductCard key={product.id} product={product} priority={shelfIndex === 0 && productIndex < 2} />
                    ))}
                  </div>
                  {total > products.length && (
                    <Link href={`/products/category/${category.slug}`} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-white hover:bg-primary-600">
                      View All Products
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <div className="sr-only">
        {shelves.map(({ category, products }) => (
          <section key={category.id}>
            <h2>{category.name}</h2>
            <Link href={`/products/category/${category.slug}`}>View all {category.name} products</Link>
            <ul>
              {products.map(product => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
