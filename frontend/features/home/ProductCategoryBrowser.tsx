'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, Search, X } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { getProducts } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import type { Category, ProductListItem } from '@/types'

export type CategoryShelf = {
  category: Category
  products: ProductListItem[]
  total: number
}

interface ProductCategoryBrowserProps {
  categories: Category[]
  shelves: CategoryShelf[]
}

export default function ProductCategoryBrowser({ categories, shelves }: ProductCategoryBrowserProps) {
  const [activeSlug, setActiveSlug] = useState(shelves[0]?.category.slug || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [productResults, setProductResults] = useState<ProductListItem[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const activeShelf = useMemo(
    () => shelves.find(shelf => shelf.category.slug === activeSlug) || shelves[0],
    [activeSlug, shelves],
  )
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const searching = normalizedSearch.length >= 2
  const categoryResults = useMemo(() => {
    if (!searching) return []

    return categories
      .filter(category => {
        const searchable = `${category.name} ${category.description || ''} ${category.slug}`.toLowerCase()
        return searchable.includes(normalizedSearch)
      })
      .slice(0, 6)
  }, [categories, normalizedSearch, searching])

  useEffect(() => {
    if (!searching) {
      setProductResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const data = await getProducts({ search: searchQuery.trim(), page: 1 })
        if (!cancelled) setProductResults(data.results.slice(0, 8))
      } catch {
        if (!cancelled) setProductResults([])
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchQuery, searching])

  if (!shelves.length || !activeShelf) return null

  return (
    <div className="mt-12">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">Category Navigation Tabs</p>
          <h2 className="mt-1 text-2xl font-black text-primary">Browse by Category</h2>
        </div>
        <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
          <form
            onSubmit={event => {
              event.preventDefault()
              if (searchQuery.trim()) {
                window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`
              }
            }}
            className="relative flex-1"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search products or categories"
              className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-10 text-sm font-semibold text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-primary"
                aria-label="Clear category search"
              >
                <X size={15} />
              </button>
            )}
          </form>
          <Link href="/products" className="inline-flex h-11 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-bold text-accent hover:border-accent hover:text-primary">
            Full catalog
          </Link>
        </div>
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
          {searching ? (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-primary">Search Results</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-500">
                    Matching products and categories for "{searchQuery.trim()}".
                  </p>
                </div>
                <Link href={`/products?search=${encodeURIComponent(searchQuery.trim())}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-white hover:bg-primary-600">
                  View All Matches
                  <ArrowRight size={16} />
                </Link>
              </div>

              {!!categoryResults.length && (
                <div className="mb-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryResults.map(category => (
                      <Link key={category.id} href={`/products/category/${category.slug}`} className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-black text-primary hover:border-accent hover:text-accent">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchLoading ? (
                <div className="rounded-md border border-dashed border-zinc-200 p-8 text-center text-sm font-bold text-zinc-500">Searching catalog...</div>
              ) : productResults.length ? (
                <div className="grid grid-cols-4 gap-4 transition-opacity duration-200">
                  {productResults.map((product, index) => (
                    <ProductCard key={product.id} product={product} priority={index < 4} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-zinc-200 p-8 text-center text-sm font-bold text-zinc-500">No matching products found.</div>
              )}
            </>
          ) : (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-primary">{activeShelf.category.name}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-500">
                    {activeShelf.category.description || `Latest ${activeShelf.category.name} products supplied by ${SITE_CONFIG.name}.`}
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
            </>
          )}
        </section>
      </div>

      <div className="space-y-3 lg:hidden">
        {searching ? (
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            {!!categoryResults.length && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categoryResults.map(category => (
                    <Link key={category.id} href={`/products/category/${category.slug}`} className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-black text-primary hover:border-accent hover:text-accent">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {searchLoading ? (
              <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-sm font-bold text-zinc-500">Searching catalog...</div>
            ) : productResults.length ? (
              <div className="grid grid-cols-2 gap-2.5">
                {productResults.map((product, productIndex) => (
                  <ProductCard key={product.id} product={product} priority={productIndex < 2} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-200 p-6 text-center text-sm font-bold text-zinc-500">No matching products found.</div>
            )}
          </section>
        ) : shelves.map(({ category, products, total }, shelfIndex) => {
          const mobileProducts = products.slice(0, products.length > 1 ? 2 : 1)
          return (
            <section key={category.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <Link
                href={`/products/category/${category.slug}`}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 text-left text-sm font-black text-primary hover:text-accent"
              >
                <span className="line-clamp-1">{category.name}</span>
                <ArrowRight size={17} className="shrink-0 text-accent" />
              </Link>
              <div className="border-t border-zinc-200 p-3">
                <h2 className="sr-only">{category.name}</h2>
                <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                  {category.description || `Latest ${category.name} products supplied by ${SITE_CONFIG.name}.`}
                </p>
                <div className={`grid gap-2.5 ${mobileProducts.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {mobileProducts.map((product, productIndex) => (
                    <ProductCard key={product.id} product={product} priority={shelfIndex === 0 && productIndex < 2} />
                  ))}
                </div>
                {total > mobileProducts.length && (
                  <Link href={`/products/category/${category.slug}`} className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-black text-white hover:bg-primary-600">
                    View All Products
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
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
