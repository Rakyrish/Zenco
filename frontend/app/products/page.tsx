import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/constants'
import { generatePageMetadata, breadcrumbSchema } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: `Industrial Chemical Products Catalog | Buy Chemicals Online`,
  description: `Browse ${SITE_CONFIG.fullName}'s complete catalog of industrial chemicals, solvents, water treatment chemicals, and specialty chemicals. Available for supply across ${SITE_CONFIG.serviceArea}. Request quotes instantly.`,
  path: '/products',
  keywords: [
    'industrial chemicals catalog',
    'buy chemicals online Kenya',
    'chemical supplier East Africa',
    'water treatment chemicals',
    'industrial solvents',
    'detergent chemicals',
    'food grade chemicals',
    'cosmetic chemicals',
    'laboratory chemicals',
    'mining chemicals',
    'manufacturing raw materials',
    `chemical supplier ${SITE_CONFIG.address.city}`,
  ],
})

export { default } from './ProductsPageContent'
