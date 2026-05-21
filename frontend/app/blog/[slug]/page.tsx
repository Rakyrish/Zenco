'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, Clock, CheckCircle } from 'lucide-react'
import { getBlogPostBySlug } from '@/lib/api'
import type { BlogPostDetail } from '@/types'
import { articleSchema } from '@/lib/metadata'
import { formatDate } from '@/lib/utils'

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPostDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getBlogPostBySlug(slug)
        setPost(data)
      } catch (err) {
        console.error('Failed to get article details, using mock fallback.', err)
        // Fallback Mock detail
        setPost({
          id: '1',
          title: 'Modern Wastewater Treatment: Choosing the Right Flocculants',
          slug: 'choosing-right-flocculants-wastewater',
          excerpt: 'Wastewater purification efficiency depends entirely on polymer weight and charge. Learn how to optimize dosage rates.',
          content: `
<h2>The Role of Flocculants in Industrial Water Treatment</h2>
<p>Industrial wastewater contains complex suspended colloids that resist natural settling due to negative electrical surface charges. Flocculants—typically long-chain polymers—are introduced to bridge these particles into larger aggregates, or "flocs," that rapidly precipitate out of suspension.</p>

<h3>Understanding Cationic vs. Anionic Polymers</h3>
<p>Flocculants are classified by their electrical charge properties:</p>
<ul>
  <li><strong>Cationic Flocculants:</strong> Carry positive charges. They are highly effective for organic residues, biological sludge (like that found in municipal sewage or dairies), and food processing waste.</li>
  <li><strong>Anionic Flocculants:</strong> Carry negative charges. Primarily utilized in mineral processing, mining operations, metal surface treatments, and inorganic tailing ponds.</li>
</ul>

<h3>Key Factors in Selection & Dosage Calculations</h3>
<p>Selecting the optimal flocculation agent requires testing three critical parameters:</p>
<ol>
  <li><strong>Sludge pH Level:</strong> pH dictates polymer charge stability. Cationic polymers lose effectiveness in highly alkaline environments.</li>
  <li><strong>Viscosity / Agitation Rate:</strong> High-shear mixing breaks apart newly formed flocs. Polymer addition must happen post-shear.</li>
  <li><strong>Active Solids Percentage:</strong> Over-dosing causes polymer saturation, which actually restabilizes colloids instead of precipitating them. Jar testing is essential.</li>
</ol>

<h3>Zenco Systems Expert Formulation Services</h3>
<p>Our Nairobi chemical laboratory assists manufacturing operations with customized jar tests to establish precise chemical dosages, preventing raw material waste and ensuring full NEMA discharge compliance. Contact our technical team today to schedule an onsite water quality review.</p>
          `,
          category: { id: 1, name: 'Water Treatment', slug: 'water-treatment', description: '', color: 'blue' },
          featured_image: null,
          og_image: null,
          tags: ['Water Treatment', 'Flocculants', 'Compliance'],
          reading_time: 5,
          is_featured: true,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_name: 'Dr. Arthur Otieno',
          views_count: 142,
          seo_title: 'Choosing Flocculants for Industrial Wastewater | Zenco Systems',
          seo_description: 'Expert guide on choosing cationic vs anionic flocculant polymers for water treatment systems. Calculate optimal polymer dosage.',
          canonical_url: '',
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin text-accent text-3xl">⚗</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center flex-col px-4 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Article Not Found</h1>
        <p className="text-gray-500 mb-6">The blog post you are looking for has been archived or does not exist.</p>
        <Link href="/blog" className="btn-primary">Back to Blog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      {/* Schema.org Article Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleSchema({
              title: post.title,
              excerpt: post.excerpt,
              slug: post.slug,
              publishedAt: post.published_at,
              updatedAt: post.updated_at,
              authorName: post.author_name,
            })
          ),
        }}
      />

      <div className="container-xl px-4">
        {/* Navigation back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-accent mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        {/* Article Layout */}
        <article className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 p-6 md:p-12 shadow-card">
          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8 text-xs md:text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="text-[10px] md:text-xs font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                {post.category?.name || 'Chemicals'}
              </span>
              <div className="flex items-center gap-1.5 font-medium">
                <User size={14} className="text-accent" />
                <span>{post.author_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{formatDate(post.published_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{post.reading_time} min read</span>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed font-medium italic border-l-4 border-accent pl-4 mb-8">
            {post.excerpt}
          </p>

          {/* Content Block */}
          <div
            className="prose prose-primary max-w-none prose-sm md:prose-base space-y-6 text-gray-600 leading-relaxed
                       prose-headings:text-primary prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-3
                       prose-h2:text-2xl prose-h3:text-xl
                       prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                       prose-li:mb-1
                       prose-strong:text-primary prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-8 mt-12">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {/* CTA Strip */}
        <div className="max-w-4xl mx-auto bg-gradient-hero rounded-3xl p-8 text-white mt-12 pattern-dots flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl border border-white/10">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-lg">Need Wastewater Optimization?</h4>
            <p className="text-xs text-white/70">
              Schedule a jar test at your treatment plant with our chemical engineers.
            </p>
          </div>
          <Link
            href="/contact?type=technical"
            className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-glow-accent"
          >
            Contact Technical Team
            <CheckCircle size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
