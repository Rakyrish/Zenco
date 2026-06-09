'use client'

import Link from 'next/link'
import { Eye, MessageCircle } from 'lucide-react'
import type { ProductListItem } from '@/types'
import { AVAILABILITY_LABELS } from '@/lib/constants'
import ProductImageFrame from './ProductImageFrame'
import { isOutOfStock, whatsappHref } from './product-helpers'

export default function ProductCard({ product, priority = false }: { product: ProductListItem; priority?: boolean }) {
  const label = AVAILABILITY_LABELS[product.availability] || AVAILABILITY_LABELS.in_stock
  const unavailable = isOutOfStock(product)
  const statusLabel = unavailable ? AVAILABILITY_LABELS.out_of_stock : label
  const forceWhiteStatus = unavailable || product.availability === 'in_stock'

  return (
    <article className="group flex h-full min-h-[255px] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl sm:min-h-[340px] md:min-h-[390px]">
      <ProductImageFrame product={product} priority={priority} className="aspect-[4/3] w-full" />

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2 sm:mb-2">
          <Link
            href={`/products/category/${product.category_slug}`}
            className="truncate text-[9px] font-extrabold uppercase tracking-[0.12em] text-accent hover:text-primary sm:text-[11px] sm:tracking-widest"
          >
            {product.category_name}
          </Link>
        </div>

        <h3 className="line-clamp-2 min-h-[2.25rem] break-words text-sm font-extrabold leading-snug text-primary transition group-hover:text-accent sm:min-h-[2.65rem] sm:text-base md:min-h-[3rem]">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="mt-2 sm:mt-3">
          <span
            className={`inline-flex min-h-6 items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] sm:min-h-7 sm:px-2.5 sm:py-1 sm:text-[11px] sm:tracking-widest ${statusLabel.color}`}
            style={forceWhiteStatus ? { backgroundColor: '#fff' } : undefined}
          >
            {unavailable ? 'Out of Stock' : statusLabel.label}
          </span>
        </div>
        <p className="mt-3 hidden line-clamp-3 min-h-[4.25rem] text-sm leading-relaxed text-zinc-600 sm:block">
          {product.short_description}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3 sm:gap-2 sm:pt-5">
          <a
            href={whatsappHref(product, 'catalog product card inquiry')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-green-600 px-2 text-xs font-bold text-white transition hover:bg-green-700 sm:h-10 sm:px-3"
            aria-label={`Ask about ${product.name} on WhatsApp`}
            title="WhatsApp"
          >
            <MessageCircle size={15} />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-2 text-xs font-bold text-white transition hover:bg-primary-600 sm:h-10 sm:px-3"
            aria-label={`View ${product.name}`}
            title="View Product"
          >
            <Eye size={15} />
            <span className="hidden sm:inline whitespace-nowrap">Views Product</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
