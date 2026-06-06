'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, MessageCircle, Search, SlidersHorizontal, X } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { whatsappHref } from '@/components/products/product-helpers'
import { getCategories, getProducts } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import type { Category, ProductListItem } from '@/types'

const sortOptions = [
  { label: 'Catalog order', value: 'sort_order,name' },
  { label: 'Newest', value: '-created_at' },
  { label: 'Alphabetical', value: 'name' },
  { label: 'Popular', value: '-sort_order' },
]

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [availability, setAvailability] = useState(searchParams.get('availability') || 'all')
  const [sort, setSort] = useState(searchParams.get('sort') || sortOptions[0].value)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category !== 'all') params.set('category', category)
    if (availability !== 'all') params.set('availability', availability)
    if (sort !== sortOptions[0].value) params.set('sort', sort)
    router.replace(`/products${params.toString() ? `?${params}` : ''}`, { scroll: false })
  }, [availability, category, router, search, sort])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setPage(1)
      try {
        const [catData, prodData] = await Promise.all([
          getCategories(),
          getProducts({
            category: category === 'all' ? undefined : category,
            search: search || undefined,
            availability: availability === 'all' ? undefined : availability,
            ordering: sort,
            page: 1,
          }),
        ])
        setCategories(catData)
        setProducts(prodData.results)
        setHasMore(Boolean(prodData.next))
      } catch (err) {
        console.error('Failed to load products page data', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [availability, category, search, sort])

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    return products
      .filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.category_name.toLowerCase().includes(term) ||
        product.short_description.toLowerCase().includes(term) ||
        product.regions_available.join(' ').toLowerCase().includes(term)
      )
      .slice(0, 5)
  }, [products, search])

  const loadMore = async () => {
    const nextPage = page + 1
    const prodData = await getProducts({
      category: category === 'all' ? undefined : category,
      search: search || undefined,
      availability: availability === 'all' ? undefined : availability,
      ordering: sort,
      page: nextPage,
    })
    setProducts(prev => [...prev, ...prodData.results])
    setHasMore(Boolean(prodData.next))
    setPage(nextPage)
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('all')
    setAvailability('all')
    setSort(sortOptions[0].value)
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <section className="border-b border-zinc-200 bg-white">
        <div className="container-xl px-4 py-10">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <span className="text-primary">Products</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-accent">Industrial chemicals catalog</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-primary md:text-6xl">Premium Chemical Product Catalog</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 md:text-base">
                Browse {SITE_CONFIG.name} products by category, application, availability, and procurement need across {SITE_CONFIG.serviceArea}.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-sm font-black text-primary">Need bulk supply guidance?</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">Send the product name, destination, quantity, and packaging preference.</p>
              <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-green-600 text-sm font-black text-white hover:bg-green-700">
                <MessageCircle size={17} />
                WhatsApp Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl px-4 py-8">
        <div className="mb-6 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px_180px_190px]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search by product, category, application, industry, keyword..."
              className="h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <X size={16} />
              </button>
            )}
            {!!suggestions.length && (
              <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
                {suggestions.map(product => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="flex items-center gap-3 border-b border-zinc-100 p-3 last:border-b-0 hover:bg-zinc-50">
                    <span className="h-10 w-12 overflow-hidden rounded bg-zinc-100">
                      {product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-primary">{product.name}</span>
                      <span className="block text-xs text-zinc-500">{product.category_name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <select value={category} onChange={event => setCategory(event.target.value)} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-primary">
            <option value="all">All categories</option>
            {categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>

          <select value={availability} onChange={event => setAvailability(event.target.value)} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-primary">
            <option value="all">All availability</option>
            <option value="in_stock">In stock</option>
            <option value="limited">Limited</option>
            <option value="on_order">On order</option>
            <option value="out_of_stock">Out of stock</option>
          </select>

          <select value={sort} onChange={event => setSort(event.target.value)} className="h-11 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-primary">
            {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
            <Filter size={16} className="text-accent" />
            {loading ? 'Loading catalog...' : `${products.length} products shown`}
          </div>
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-primary hover:border-accent">
            <SlidersHorizontal size={14} />
            Reset filters
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[430px] animate-pulse rounded-lg border border-zinc-200 bg-white" />)}
          </div>
        ) : products.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button type="button" onClick={loadMore} className="rounded-md bg-primary px-6 py-3 text-sm font-black text-white hover:bg-primary-600">
                  Load More Products
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-black text-primary">No products found</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">Try another keyword, category, application, or availability filter.</p>
            <button type="button" onClick={clearFilters} className="mt-5 rounded-md bg-accent px-5 py-3 text-sm font-black text-white">Clear Filters</button>
          </div>
        )}

        {!!categories.length && (
          <section className="mt-12">
            <h2 className="text-2xl font-black text-primary">Category Catalogs</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map(item => (
                <Link key={item.slug} href={`/products/category/${item.slug}`} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-accent hover:shadow-lg">
                  <span className="text-xs font-black uppercase tracking-widest text-accent">{item.product_count} products</span>
                  <h3 className="mt-2 text-lg font-black text-primary">{item.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{item.description || `Browse ${item.name} chemicals supplied by ${SITE_CONFIG.name}.`}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <ProductsContent />
    </Suspense>
  )
}
