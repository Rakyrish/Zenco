import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

/**
 * robots.txt — Google Best Practices
 *
 * - Allow all public pages for crawling
 * - Block admin, API, internal Next.js routes
 * - Allow Googlebot, Bingbot, and other major crawlers
 * - Block AI training crawlers
 * - Reference sitemap for discovery
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/django-admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  }
}
