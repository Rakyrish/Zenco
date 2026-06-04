'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ProductDetail } from '@/types'
import ProductImageFrame from './ProductImageFrame'

export default function ProductGallery({ product }: { product: ProductDetail }) {
  const images = useMemo(() => [product.image, ...(product.gallery || [])].filter(Boolean) as string[], [product.gallery, product.image])
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const displayProduct = { ...product, image: images[active] || product.image }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setActive(index => Math.min(index + 1, Math.max(images.length - 1, 0)))
      if (event.key === 'ArrowLeft') setActive(index => Math.max(index - 1, 0))
      if (event.key === 'Escape') setZoomed(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length])

  const move = (direction: 1 | -1) => {
    setActive(index => {
      if (!images.length) return 0
      return (index + direction + images.length) % images.length
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="relative block w-full overflow-hidden rounded-lg border border-zinc-200 bg-white text-left shadow-sm"
      >
        <ProductImageFrame product={displayProduct} priority size="hero" className="aspect-[5/4] w-full" />
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded bg-white/85 px-3 py-2 text-xs font-bold text-primary backdrop-blur">
          <Search size={14} />
          Zoom
        </span>
      </button>

      {images.length > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-primary">
            <ChevronLeft size={18} />
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setActive(index)}
                className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border ${index === active ? 'border-accent ring-2 ring-accent/25' : 'border-zinc-200'}`}
              >
                <ProductImageFrame product={{ ...product, image }} size="thumb" className="h-full w-full" />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => move(1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-primary">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {zoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoomed(false)}>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white" onClick={event => event.stopPropagation()}>
            <ProductImageFrame product={displayProduct} priority size="hero" className="max-h-[92vh] w-full" imageClassName="object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
