import type { Metadata } from 'next'
import { getBlogPosts } from '@/lib/api'
import { SITE_CONFIG } from '@/lib/constants'
import { generatePageMetadata, breadcrumbSchema } from '@/lib/metadata'
import BlogListingContent from './BlogListingContent'

export const metadata: Metadata = generatePageMetadata({
  title: `Industrial Chemical Blog & Industry Insights`,
  description: `Stay updated with the latest news, expert guides, wastewater safety protocols, chemical manufacturing insights, and laboratory calculations from ${SITE_CONFIG.fullName}.`,
  path: '/blog',
  keywords: [
    'chemical industry blog',
    'water treatment news Kenya',
    'industrial chemical guide',
    'chemical safety guides East Africa',
    'Zenco Systems insights',
  ],
})

export default async function BlogListingPage() {
  let posts: any[] = []
  try {
    const data = await getBlogPosts()
    posts = data.results
  } catch (err) {
    console.error('Failed to pre-fetch blog posts on server', err)
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
  ]

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema(breadcrumbs)),
        }}
      />
      <div className="container-xl px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="section-tag">{SITE_CONFIG.name} Insights</span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-3">Blog & Industry News</h1>
          <p className="text-gray-500 leading-relaxed">
            Read professional insights, engineering calculators, safety guidelines, and updates from the {SITE_CONFIG.name} technical team.
          </p>
        </div>

        <BlogListingContent initialPosts={posts} />
      </div>
    </div>
  )
}
