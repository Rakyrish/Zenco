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

  return (
    <article className="group flex h-full min-h-[390px] flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl">
      <ProductImageFrame product={product} priority={priority} className="aspect-[4/3] w-full" />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Link
            href={`/products/category/${product.category_slug}`}
            className="truncate text-[11px] font-extrabold uppercase tracking-widest text-accent hover:text-primary"
          >
            {product.category_name}
          </Link>
        </div>

        <h3 className="line-clamp-2 min-h-[3rem] text-base font-extrabold leading-snug text-primary transition group-hover:text-accent">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="mt-3">
          <span className={`inline-flex min-h-7 items-center rounded px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${statusLabel.color}`}>
            {unavailable ? 'Out of Stock' : statusLabel.label}
          </span>
        </div>
        <p className="mt-3 line-clamp-3 min-h-[4.25rem] text-sm leading-relaxed text-zinc-600">
          {product.short_description}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <a
            href={whatsappHref(product, 'catalog product card inquiry')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-green-600 px-3 text-xs font-bold text-white transition hover:bg-green-700"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-600"
          >
            <Eye size={15} />
            View Product
          </Link>
        </div>
      </div>
    </article>
  )
}
