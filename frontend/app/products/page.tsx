'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Eye, ShoppingBag, SlidersHorizontal, Layers, CheckCircle } from 'lucide-react'
import { getProducts, getCategories } from '@/lib/api'
import type { ProductListItem, Category } from '@/types'
import { AVAILABILITY_LABELS, PRODUCT_CATEGORIES } from '@/lib/constants'

function ProductsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialCategory = searchParams.get('category') || 'all'
  const initialSearch = searchParams.get('search') || ''

  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(initialSearch)
  const [selectedCat, setSelectedCat] = useState(initialCategory)
  const [loading, setLoading] = useState(true)

  // MOCK Fallbacks in case DRF is offline
  const mockCategories: Category[] = PRODUCT_CATEGORIES.map((c, idx) => ({
    id: String(idx + 1),
    name: c.name,
    slug: c.slug,
    description: `Industrial ${c.name.toLowerCase()} supplies.`,
    icon: '⚗',
    image: null,
    sort_order: idx + 1,
    seo_title: c.name,
    seo_description: `Zenco Systems ${c.name} supplies.`,
    product_count: 5,
    is_active: true,
  }))

  const mockProducts: ProductListItem[] = [
    {
      id: '1',
      name: 'Sodium Hypochlorite 15%',
      slug: 'sodium-hypochlorite-15',
      short_description: 'High-grade water chlorination and disinfection chemical agent.',
      category: 'water-treatment',
      category_name: 'Water Treatment',
      category_slug: 'water-treatment',
      image: null,
      availability: 'in_stock',
      is_featured: true,
      regions_available: ['Kenya', 'Uganda', 'Tanzania'],
    },
    {
      id: '2',
      name: 'Industrial Ethyl Acetate',
      slug: 'ethyl-acetate',
      short_description: 'Premium organic solvent for paint, coating, and cosmetic formulations.',
      category: 'solvents-thinners',
      category_name: 'Solvents & Thinners',
      category_slug: 'solvents-thinners',
      image: null,
      availability: 'in_stock',
      is_featured: true,
      regions_available: ['Kenya', 'Rwanda'],
    },
    {
      id: '3',
      name: 'Hydrochloric Acid 33%',
      slug: 'hydrochloric-acid-33',
      short_description: 'Strong mineral acid widely used for metal pickling, pH adjustment and water treatment.',
      category: 'water-treatment',
      category_name: 'Water Treatment',
      category_slug: 'water-treatment',
      image: null,
      availability: 'limited',
      is_featured: true,
      regions_available: ['Kenya', 'Uganda'],
    },
    {
      id: '4',
      name: 'Isopropyl Alcohol (IPA) 99.9%',
      slug: 'isopropyl-alcohol-99',
      short_description: 'High-purity solvent and sanitizer component for cosmetics and pharmaceuticals.',
      category: 'pharmaceuticals-cosmetics',
      category_name: 'Pharma & Cosmetics',
      category_slug: 'pharmaceuticals-cosmetics',
      image: null,
      availability: 'in_stock',
      is_featured: true,
      regions_available: ['Kenya', 'Tanzania', 'Rwanda', 'Uganda'],
    },
    {
      id: '5',
      name: 'Liquid Chlorine',
      slug: 'liquid-chlorine',
      short_description: 'Bulk liquid chlorine for municipal water systems and large industrial cooling towers.',
      category: 'water-treatment',
      category_name: 'Water Treatment',
      category_slug: 'water-treatment',
      image: null,
      availability: 'on_order',
      is_featured: false,
      regions_available: ['Kenya'],
    },
    {
      id: '6',
      name: 'Toluene Industrial Grade',
      slug: 'toluene',
      short_description: 'Standard solvent for chemical syntheses and paint formulations.',
      category: 'solvents-thinners',
      category_name: 'Solvents & Thinners',
      category_slug: 'solvents-thinners',
      image: null,
      availability: 'in_stock',
      is_featured: false,
      regions_available: ['Kenya', 'Tanzania'],
    },
  ]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [catData, prodData] = await Promise.all([
          getCategories().catch(() => mockCategories),
          getProducts({
            category: selectedCat === 'all' ? undefined : selectedCat,
            search: search || undefined,
          }).catch(() => ({ results: mockProducts })),
        ])
        setCategories(catData)
        
        // Custom local search filter if DRF mock is used
        let filtered = prodData.results
        if (selectedCat !== 'all') {
          filtered = filtered.filter(p => p.category_slug === selectedCat)
        }
        if (search) {
          filtered = filtered.filter(
            p =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.short_description.toLowerCase().includes(search.toLowerCase())
          )
        }
        setProducts(filtered)
      } catch (err) {
        console.error('Failed to load products page data', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedCat, search])

  const handleCategoryChange = (slug: string) => {
    setSelectedCat(slug)
    const params = new URLSearchParams(searchParams)
    if (slug === 'all') {
      params.delete('category')
    } else {
      params.set('category', slug)
    }
    router.replace(`/products?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="container-xl px-4">
        {/* Breadcrumbs & Header */}
        <div className="mb-10 text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center gap-2 text-xs text-gray-500 font-semibold mb-3">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>/</span>
            <span className="text-primary">Products</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Product Catalog</h1>
          <p className="text-gray-500 max-w-2xl">
            Browse through our wide range of industrial, water treatment, and formulation chemicals.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Category selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={16} className="text-accent" />
                Categories
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedCat === 'all'
                      ? 'bg-accent text-white shadow-glow-accent'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      selectedCat === cat.slug
                        ? 'bg-accent text-white shadow-glow-accent'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality assurance banner */}
            <div className="bg-gradient-hero rounded-2xl p-6 text-white pattern-dots border border-white/10 shadow-lg">
              <CheckCircle size={28} className="text-accent mb-4" />
              <h3 className="font-bold text-base mb-2">Purity Guaranteed</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                All raw chemical consignments undergo strict in-house laboratory checks before delivery.
              </p>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="lg:col-span-9 space-y-6">
            {/* Search and total counts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="relative w-full md:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search products by chemical formula or name…"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <SlidersHorizontal size={14} className="text-accent" />
                Showing {products.length} Products
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <p className="text-lg font-bold text-primary mb-2">No Products Found</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  We couldn't find any products matching your current filters. Try resetting search or checking another category.
                </p>
                <button
                  onClick={() => {
                    setSearch('')
                    handleCategoryChange('all')
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(product => {
                  const labelObj = AVAILABILITY_LABELS[product.availability] || { label: 'In Stock', color: 'text-green-600 bg-green-50' }
                  return (
                    <article key={product.id} className="card-hover bg-white flex flex-col justify-between group">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                            {product.category_name}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${labelObj.color}`}>
                            {labelObj.label}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-6">
                          {product.short_description}
                        </p>

                        <div className="space-y-1.5 border-t border-gray-100 pt-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Regions Available:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {product.regions_available.map(reg => (
                              <span
                                key={reg}
                                className="text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
                              >
                                {reg}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="flex-1 btn bg-primary hover:bg-primary-600 text-white text-xs py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} />
                          Details
                        </Link>
                        <Link
                          href={`/contact?type=quote&product=${encodeURIComponent(product.name)}`}
                          className="flex-1 btn bg-accent hover:bg-accent-500 text-white text-xs py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 animate-pulse-glow"
                        >
                          <ShoppingBag size={14} />
                          Quote
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin text-accent text-3xl">⚗</div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
