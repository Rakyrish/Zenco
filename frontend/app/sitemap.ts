import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/constants'
import { getAllProducts, getAllBlogPosts, getCategories, getServices, getIndustries } from '@/lib/api'
import { INDUSTRY_PAGES, SERVICE_PAGES } from '@/lib/navigation-content'

/**
 * Dynamic XML Sitemap — Enterprise SEO
 *
 * - Paginates through ALL products and blog posts (not just page 1)
 * - Uses actual database updated_at timestamps
 * - Product pages: priority 0.95 (highest transactional value)
 * - Includes sitemap images for product pages
 * - Revalidates every 60s for near-real-time admin dashboard updates
 */
export const revalidate = 60 // 1 minute — new products appear fast

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url

  // ─── Static Routes ──────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/industries`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faqs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
  ]

  // ─── Dynamic Routes (parallel fetch — all pages) ────────────────────────
  const [products, categories, posts, services, industries] = await Promise.allSettled([
    getAllProducts(),
    getCategories(),
    getAllBlogPosts(),
    getServices(),
    getIndustries(),
  ])

  // Product pages — priority 0.95, actual timestamps, with images
  const productRoutes: MetadataRoute.Sitemap =
    products.status === 'fulfilled'
      ? products.value.map(p => ({
          url: `${base}/products/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.95,
          ...(p.image ? { images: [p.image] } : {}),
        }))
      : []

  // Category pages
  const categoryRoutes: MetadataRoute.Sitemap =
    categories.status === 'fulfilled'
      ? categories.value.map(c => ({
          url: `${base}/products/category/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : []

  // Blog post pages — actual timestamps
  const blogRoutes: MetadataRoute.Sitemap =
    posts.status === 'fulfilled'
      ? posts.value.map(p => ({
          url: `${base}/blog/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(p.published_at),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          ...(p.featured_image ? { images: [p.featured_image] } : {}),
        }))
      : []

  // Service pages — merge static content pages with API data
  const serviceRoutes: MetadataRoute.Sitemap =
    Array.from(new Set([
      ...SERVICE_PAGES.map(service => service.slug),
      ...(services.status === 'fulfilled' ? services.value.map(service => service.slug) : []),
    ])).map(slug => ({
          url: `${base}/services/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))

  // Industry pages — merge static content pages with API data
  const industryRoutes: MetadataRoute.Sitemap =
    Array.from(new Set([
      ...INDUSTRY_PAGES.map(industry => industry.slug),
      ...(industries.status === 'fulfilled' ? industries.value.map(industry => industry.slug) : []),
    ])).map(slug => ({
          url: `${base}/industries/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...blogRoutes,
    ...serviceRoutes,
    ...industryRoutes,
  ]
}
