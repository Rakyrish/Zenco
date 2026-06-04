import type { ProductListItem } from '@/types'
import { SITE_CONFIG } from '@/lib/constants'

export function isOutOfStock(product: Pick<ProductListItem, 'availability' | 'stock_quantity'>) {
  return product.availability === 'out_of_stock' || product.stock_quantity === 0
}

export function productTags(product: ProductListItem, limit = 4) {
  return [
    product.category_name,
    product.is_featured ? 'Featured' : '',
    ...product.regions_available,
  ].filter(Boolean).slice(0, limit)
}

export function cloudinaryImage(url?: string | null, width = 900, height = 680) {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_fill,w_${width},h_${height}/`)
}

export function productUrl(product?: Pick<ProductListItem, 'slug'>) {
  return product?.slug ? `${SITE_CONFIG.url}/products/${product.slug}` : `${SITE_CONFIG.url}/products`
}

export function whatsappMessage(product?: Pick<ProductListItem, 'name' | 'slug' | 'category_name'>, context = 'product inquiry') {
  if (!product) {
    return 'Hello Zenco Chemicals Ltd, I am interested in your industrial chemical products. Please provide catalog and quotation assistance.'
  }

  return [
    `Hello Zenco Chemicals Ltd, I am interested in ${product.name}.`,
    '',
    `Product: ${productUrl(product)}`,
    `Category: ${product.category_name || 'Chemical products'}`,
    `Inquiry context: ${context}`,
    '',
    'Please provide a quotation, availability, packaging options, and delivery details.',
  ].join('\n')
}

export function whatsappHref(product?: Pick<ProductListItem, 'name' | 'slug' | 'category_name'> | string, context = 'product inquiry') {
  const message = typeof product === 'string'
    ? `Hello Zenco Chemicals Ltd, I am interested in ${product}. Please provide a quotation, availability, packaging options, and delivery details.`
    : whatsappMessage(product, context)
  const number = SITE_CONFIG.whatsapp.replace(/[^\d]/g, '')
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `/contact${typeof product === 'object' && product?.name ? `?type=quote&product=${encodeURIComponent(product.name)}` : ''}`
}

export function productAlt(product: Pick<ProductListItem, 'name' | 'category_name'>) {
  return `${product.name} industrial chemical supplied by Zenco Chemicals Ltd in ${product.category_name}`
}
