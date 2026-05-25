'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Eye } from 'lucide-react'
import { getFeaturedProducts } from '@/lib/api'
import type { ProductListItem } from '@/types'
import { mediaUrl } from '@/lib/utils'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedProducts()
        setProducts(data.slice(0, 4))
      } catch (err) {
        console.error('Failed to load featured products.', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="section bg-surface">
      <div className="container-xl">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span className="section-tag">Featured Catalog</span>
            <h2 className="section-title">Most In-Demand Chemical Products</h2>
            <p className="section-subtitle mt-2">
              Explore our core premium industrial raw materials in stock and ready for dispatch.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline mt-4 md:mt-0 group"
          >
            Browse Full Catalog
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <article key={product.id} className="card-hover bg-white flex flex-col justify-between group">
                <div className="p-6">
                  {/* Category & Availability */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {product.category_name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                      <span className="h-1 w-1 rounded-full bg-green-500" />
                      In Stock
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-6">
                    {product.short_description}
                  </p>

                  {/* Regions info */}
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

                {/* Footer actions */}
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex gap-2">
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex-1 btn bg-primary hover:bg-primary-600 text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} />
                    Details
                  </Link>
                  <Link
                    href={`/contact?type=quote&product=${encodeURIComponent(product.name)}`}
                    className="flex-1 btn bg-accent hover:bg-accent-500 text-white text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={14} />
                    Quote
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
