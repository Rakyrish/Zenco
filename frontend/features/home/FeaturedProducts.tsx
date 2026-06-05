import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import { whatsappHref } from '@/components/products/product-helpers'
import { getCategories, getFeaturedProducts, getProducts } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import ProductCategoryBrowser, { type CategoryShelf } from './ProductCategoryBrowser'

async function getHomepageShelves(categories: Awaited<ReturnType<typeof getCategories>>): Promise<CategoryShelf[]> {
  const activeCategories = categories
    .filter(category => category.is_active !== false && category.product_count > 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 7)

  const shelves = await Promise.all(
    activeCategories.map(async category => {
      const data = await getProducts({
        category: category.slug,
        ordering: '-created_at',
        page: 1,
        cache: 'force-cache',
        revalidate: 1800,
      })

      return {
        category,
        products: data.results.slice(0, 8),
        total: data.count,
      }
    }),
  )

  return shelves.filter(shelf => shelf.products.length > 0)
}

export default async function FeaturedProducts() {
  const categories = await getCategories().catch(() => [])
  const [featuredData, shelves] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getHomepageShelves(categories).catch(() => []),
  ])
  const featured = featuredData.slice(0, 8)

  return (
    <section className="bg-zinc-50 py-14">
      <div className="container-xl px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-tag">Featured Products</span>
            <h2 className="section-title">Industrial Product Catalog</h2>
            <p className="section-subtitle mt-2 max-w-3xl">
              Browse {SITE_CONFIG.name} products by category, compare availability quickly, and reach sales for fast quotation support.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={whatsappHref(undefined, 'homepage catalog inquiry')} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-green-600 px-4 text-sm font-black text-white hover:bg-green-700">
              <MessageCircle size={17} />
              WhatsApp Sales
            </a>
            <Link href="/products" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-primary hover:border-accent">
              Full Catalog
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* {featured.length > 0 && (
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-primary">Featured Products</h2>
                <p className="mt-1 text-sm text-zinc-500">Priority products selected from the Finstar Chemicals catalog.</p>
              </div>
              <Link href="/products?sort=-created_at" className="text-sm font-bold text-accent hover:text-primary">View all</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {featured.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
            </div>
          </div>
        )} */}

        <ProductCategoryBrowser categories={categories} shelves={shelves} />
      </div>
    </section>
  )
}
