'use client'

import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import type { ProductListItem } from '@/types'
import { cloudinaryImage, productAlt } from './product-helpers'

interface ProductImageFrameProps {
  product: Pick<ProductListItem, 'name' | 'category_name' | 'image' | 'availability' | 'stock_quantity'>
  className?: string
  imageClassName?: string
  priority?: boolean
  size?: 'card' | 'hero' | 'thumb'
}

export default function ProductImageFrame({
  product,
  className = '',
  imageClassName = '',
  priority = false,
  size = 'card',
}: ProductImageFrameProps) {
  const image = cloudinaryImage(
    product.image,
    size === 'hero' ? 1300 : size === 'thumb' ? 240 : 720,
    size === 'hero' ? 980 : size === 'thumb' ? 180 : 520,
  )
  const isCloudinaryImage = image.includes('res.cloudinary.com')

  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
      {image ? (
        <Image
          src={image}
          alt={productAlt(product)}
          fill
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          sizes={size === 'thumb' ? '96px' : size === 'hero' ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw'}
          unoptimized={isCloudinaryImage}
          className={`h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <div className="flex h-full min-h-[180px] w-full items-center justify-center bg-zinc-100 text-zinc-400">
          <ImageOff size={34} aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
