import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/constants'
import { getProducts, getCategories, getBlogPosts, getServices, getIndustries } from '@/lib/api'
import { INDUSTRY_PAGES, SERVICE_PAGES } from '@/lib/navigation-content'

export const revalidate = 3600 // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url

  // Static routes
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

  // Dynamic routes (parallel fetch)
  const [products, categories, posts, services, industries] = await Promise.allSettled([
    getProducts({ page: 1 }),
    getCategories(),
    getBlogPosts({ page: 1 }),
    getServices(),
    getIndustries(),
  ])

  const productRoutes: MetadataRoute.Sitemap =
    products.status === 'fulfilled'
      ? products.value.results.map(p => ({
          url: `${base}/products/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          ...(p.image ? { images: [p.image] } : {}),
        }))
      : []

  const categoryRoutes: MetadataRoute.Sitemap =
    categories.status === 'fulfilled'
      ? categories.value.map(c => ({
          url: `${base}/products/category/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
      : []

  const blogRoutes: MetadataRoute.Sitemap =
    posts.status === 'fulfilled'
      ? posts.value.results.map(p => ({
          url: `${base}/blog/${p.slug}`,
          lastModified: new Date(p.published_at),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      : []

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
